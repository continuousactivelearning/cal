from fastapi import FastAPI, HTTPException
from .schemas import VideoResponse
from .rag import upload_text
import re
import json
from fastapi.responses import JSONResponse
import google.generativeai as genai
import soundfile as sf
import whisper
import os
import uuid
# import time
from youtube_transcript_api import YouTubeTranscriptApi
from pytubefix import YouTube
from pytubefix import Playlist
from pytubefix.cli import on_progress
from typing import List, Dict
import ffmpeg
import asyncio
import aiofiles
import aiofiles.os
from dotenv import load_dotenv
import requests

# Initialize FastAPI application
app = FastAPI()

# Load environment variables from .env
load_dotenv()
API_KEY = os.getenv("API_KEY")
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL")

whisper_model = whisper.load_model("base")
os.environ["PATH"] += os.pathsep + os.getenv("FFMPEG_PATH") # Configure FFMPEG locally

print("API KEYYYY from models:", API_KEY)


async def generate_from_gemini(prompt: str, user_api_key: str) -> str:
    """
    Generates a response from either Gemini AI or Ollama AI based on the API key.

    Args:
        prompt (str): The input text prompt for the AI model.
        user_api_key (str): The API key for Gemini or "ollama1064" for Ollama.

    Returns:
        str: The generated text response from the selected AI model.
    """

    # ✅ If API Key is "ollama1064", Call Ollama API
    print(user_api_key)
    if user_api_key == "ollama1064":
        try:
            print("IDHER AAGAYA MAI")
            print(OLLAMA_API_URL)
            response = requests.post(OLLAMA_API_URL, json={
    "model": "deepseek-r1:14b",  # Specify the correct model
    "prompt": prompt,  # Ensure it is formatted properly
    "raw": True,
    "stream": False
})
            print(response)
            if response.status_code == 200:
                return response.json().get("response", "Error: No response from Ollama.")
            else:
                return f"Error: Ollama API request failed - {response.text}"
        except requests.exceptions.RequestException as e:
            return f"Error: Failed to connect to Ollama API - {str(e)}"

    # ✅ Otherwise, Call Gemini API
    try:
        genai.configure(api_key=API_KEY)  # ✅ Uses user-provided Gemini API key
        gemini_model = genai.GenerativeModel(model_name="gemini-1.5-flash")
        response = await asyncio.to_thread(gemini_model.generate_content, prompt)
        await asyncio.sleep(10)  # Prevent hitting API rate limits
        return response.text
    except Exception as e:
        return f"Error: Failed to generate response from Gemini - {str(e)}"


def hide_urls(text: str) -> str:
    """
    Hides URLs in the given text by replacing them with a placeholder.

    Args:
        text (str): The input text containing URLs.

    Returns:
        str: The text with URLs replaced by "<url-hidden>".
    """
    url_pattern = (
        r"http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|"
        r"(?:%[0-9a-fA-F][0-9a-fA-F]))+"  # Regex to match URLs
    )
    return re.sub(url_pattern, "<url-hidden>", text)


def parse_llama_json(text: str) -> Dict:
    """
    Extracts and parses JSON data from a text string.
    Returns a properly structured JSON with empty values if parsing fails.

    Args:
        text (str): The input text containing JSON data.

    Returns:
        Dict: The parsed JSON data or a structured empty JSON if parsing fails.
    """
    # Define the default empty structure
    empty_response = {
        "questions": [
            {
                "question": "",
                "options": ["", "", "", ""],
                "correct_answer": 0
            }
        ]
    }
    
    try:
        # Extract JSON part from the generated text
        start_idx = text.find("{")
        end_idx = text.rfind("}") + 1

        if start_idx == -1 or end_idx == -1:
            print("No valid JSON found in the text, returning empty result")
            return empty_response

        json_part = text[start_idx:end_idx]

        # Parse the extracted JSON
        parsed_data = json.loads(json_part)
        
        # If the parsed data doesn't have the expected structure,
        # return the empty response
        if not isinstance(parsed_data, dict):
            return empty_response
            
        # Ensure the parsed data has all required keys
        if "questions" not in parsed_data:
            parsed_data["questions"] = empty_response["questions"]
            
        return parsed_data
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Failed to parse JSON: {e}, returning empty structured result")
        return empty_response


async def generate_questions_from_prompt(
    text: str, user_api_key: str, n_questions: int, q_model: str
) -> str:
    print(n_questions)
    print("PSPSPSPSPSPSPPSPSSPPS")
    """
    Generates multiple-choice questions (MCQs) from a given text using the Gemini AI model.

    Args:
        text (str): The input text (e.g., transcript) to generate questions from.
        user_api_key (str): The API key for accessing the Gemini model.
        n_questions (int): The number of questions to generate.
        q_model (str): The type of questions to generate ("case-study" or other).

    Returns:
        str: The generated questions in JSON format.
    """
    n = n_questions  # Number of questions to generate

    task_description_analytical = """
        You are an advanced AI designed to generate challenging multiple-choice questions (MCQs) for university-level exams.
        Your goal is to:
        1. Identify core concepts, theories, or key ideas in the transcript.
        2. Frame questions that require analytical thinking, application of knowledge, or evaluation.
        3. Use domain-specific language and include plausible distractors that reflect common misconceptions or similar concepts.
        4. Include 4 answer options for each question, specifying the correct answer index.
        5. Format your response as a JSON list where each entry follows the structure:
        { "question": "<question_text>", "options": ["<option1>", "<option2>", "<option3>", "<option4>"], "correct_answer": <index_of_correct_option> }
        Types of questions:
        1. Analytical: Require reasoning or critical thinking.
        2. Application-Based: Apply concepts to new scenarios or problems.
        3. Evaluation: Require judgment or interpretation.
        Example output:
        {
            "questions" : [
                {
                    "question": "Why is photosynthesis critical for the survival of most ecosystems?",
                    "options": ["It is the only source of carbon dioxide.", "It provides oxygen for respiration.", "It creates heat energy for plants.", "It prevents water loss in leaves."],
                    "correct_answer": 1
                },
                {
                    "question": "What would likely occur if Earth's axial tilt increased?",
                    "options": ["Stronger seasonal temperature differences.", "Fewer hours of daylight at the poles.", "Reduced intensity of sunlight near the equator.", "More uniform global climates year-round."],
                    "correct_answer": 0
                },
                {
                    "question": "How does the principle of competitive exclusion influence species diversity within an ecosystem?",
                    "options": ["It causes a uniform distribution of species.", "It eliminates all predator-prey interactions.", "It leads to resource partitioning among species.", "It prevents mutualistic relationships."],
                    "correct_answer": 2
                }
            ]
        }
    """

    task_description_case_study = f"""
            You are an advanced AI tasked with generating university-level case-study-based multiple-choice questions (MCQs) from a given transcript.
            Your goal is to:
            1. Create a unique case study or scenario inspired by the transcript. The case study should:
                - Be an example or situation that applies key ideas, concepts, or theories from the transcript.
                - Go beyond summarizing the transcript by crafting a practical or hypothetical context.
            2. Frame {n}""" + """ questions that require analytical thinking, problem-solving, or evaluation based on the case study.
            3. Provide 4 answer options for each question, ensuring one is correct and the others are plausible but incorrect.
            4. Specify the index (0-based) of the correct answer for each question.
            5. Format your response as a JSON object where the case study is provided along with the questions. Use the structure:
            {
                "case_study": "<case_study_paragraph>",
                "questions": [
                    { 
                        "question": "<question_text>", 
                        "options": ["<option1>", "<option2>", "<option3>", "<option4>"], 
                        "correct_answer": <index_of_correct_option> 
                    },
                    ...
                ]
            }
            Types of questions to generate:
            1. Analytical: Require reasoning or critical thinking about the case study.
            2. Application-Based: Apply concepts to solve problems or make decisions in the context of the case study.
            3. Evaluation: Require judgment, interpretation, or assessment of the situation presented.
            Example output:
            {
                "case_study": "A new factory has been set up near a river, causing concerns about pollution. The factory produces textile dyes, which may contaminate water sources. The local government needs to balance economic benefits with environmental risks.",
                "questions": [
                    {
                        "question": "What is the most likely environmental impact of the factory's operations?",
                        "options": ["Decreased oxygen levels in the river.", "Improved water clarity.", "Increase in fish population.", "Reduction in soil erosion."],
                        "correct_answer": 0
                    },
                    {
                        "question": "Which of the following actions would best mitigate the environmental risks posed by the factory?",
                        "options": ["Enforcing stricter emission controls.", "Encouraging higher production rates.", "Diverting the river away from the factory.", "Promoting the use of synthetic materials."],
                        "correct_answer": 0
                    },
                    {
                        "question": "How might local residents be affected if pollution levels rise?",
                        "options": ["Improved access to clean drinking water.", "Increased health issues such as skin diseases.", "Higher crop yields in nearby farms.", "Reduced water temperatures in the river."],
                        "correct_answer": 1
                    }
                ]
            }
        """

    prompt_1 = task_description_analytical + '\n Here is the transcript content: \n' + str(text) + f'\nGenerate {n} questions' + ' as a JSON object in the following format: \n{ \n    "questions": [ \n        { \n            "question": "<question_text>", \n            "options": ["<option1>", "<option2>", "<option3>", "<option4>"], \n            "correct_answer": <index_of_correct_option> \n        }, \n        { \n            "question": "<question_text>", \n            "options": ["<option1>", "<option2>", "<option3>", "<option4>"], \n            "correct_answer": <index_of_correct_option> \n        }, \n        { \n            "question": "<question_text>", \n            "options": ["<option1>", "<option2>", "<option3>", "<option4>"], \n            "correct_answer": <index_of_correct_option> \n        } \n    ] \n}.'

    prompt_2 = task_description_case_study + '\n Here is the transcript content: \n' + str(text) + f'\nGenerate {n} questions' + ' as a JSON object in the following format: \n{ \n    "case_study": "<case_study_text>", \n    "questions": [ \n        { \n            "question": "<question_text>", \n            "options": ["<option1>", "<option2>", "<option3>", "<option4>"], \n            "correct_answer": <index_of_correct_option> \n        }, \n        { \n            "question": "<question_text>", \n            "options": ["<option1>", "<option2>", "<option3>", "<option4>"], \n            "correct_answer": <index_of_correct_option> \n        }, \n        { \n            "question": "<question_text>", \n            "options": ["<option1>", "<option2>", "<option3>", "<option4>"], \n            "correct_answer": <index_of_correct_option> \n        } \n    ] \n}.'

    prompt = prompt_2 if q_model == "case-study" else prompt_1
    response = await generate_from_gemini(prompt, user_api_key)
    return response


def extract_video_id(url: str) -> str:
    """
    Extracts the video ID from a YouTube URL.

    Args:
        url (str): The YouTube URL.

    Returns:
        str: The extracted video ID, or None if no valid ID is found.
    """
    patterns = [
        r"(?:https?://)?(?:www\.)?youtu\.be/([^?&]+)",
        r"(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([^?&]+)",
        r"(?:https?://)?(?:www\.)?youtube\.com/embed/([^?&]+)",
        r"(?:https?://)?(?:www\.)?youtube\.com/shorts/([^?&]+)",
        r"(?:https?://)?(?:www\.)?youtube\.com/live/([^?&]+)",
    ]

    for pattern in patterns:
        match = re.match(pattern, url)
        if match:
            return match.group(1)
    return None


async def get_urls_from_playlist(playlist_url: str):
    """
    Retrieves the URLs of all videos in a YouTube playlist.

    Args:
        playlist_url (str): The URL of the YouTube playlist.

    Returns:
        dict: A dictionary containing the list of video URLs or an error message.
    """
    try:
        playlist = await asyncio.to_thread(Playlist, playlist_url)
        video_urls = await asyncio.to_thread(lambda: list(playlist.video_urls))
        return {"video_urls": video_urls}
    except Exception as e:
        print(f"An error occurred: {e}")
        return {"error": str(e), "video_urls": []}


async def get_raw_transcript(video_id: str) -> List[Dict]:
    """
    Fetches the raw transcript of a YouTube video using its video ID.

    Args:
        video_id (str): The YouTube video ID.

    Returns:
        List[Dict]: A list of transcript entries, each containing text, start time, and duration.
    """
    try:
        transcript = await asyncio.to_thread(YouTubeTranscriptApi.get_transcript, video_id)
        return transcript
    except Exception as e:
        return []


def generate_transcript_segments(
    transcript: List[Dict], timestamps: List[int]
) -> List[Dict]:
    """
    Segments a transcript into smaller parts based on provided timestamps.

    Args:
        transcript (List[Dict]): The raw transcript data.
        timestamps (List[int]): The timestamps at which to segment the transcript.

    Returns:
        List[Dict]: A list of transcript segments, each containing text, start time, and end time.
    """
    duration = max(item["start"] + item["duration"] for item in transcript)
    if timestamps == []:
        segment_count = 4
        timestamps = [i * (duration // segment_count) for i in range(0, segment_count)]
    timestamps = sorted(timestamps)
    timestamps.append(duration + 1)  # Add 1 to ensure all text is included

    segments = []
    time_ranges = []
    current_segment = []
    segment_index = 0

    for entry in transcript:
        while (
            segment_index + 1 < len(timestamps)
            and entry["start"] >= timestamps[segment_index + 1]
        ):
            if current_segment:
                segments.append(" ".join(current_segment))
                time_ranges.append(
                    (timestamps[segment_index], timestamps[segment_index + 1])
                )
            current_segment = []
            segment_index += 1

        current_segment.append(entry["text"])

    if current_segment:
        segments.append(" ".join(current_segment))
        time_ranges.append((timestamps[segment_index], timestamps[segment_index + 1]))

    return [
        {"text": segment, "start_time": start, "end_time": end}
        for segment, (start, end) in zip(segments, time_ranges)
    ]

async def process_audio(segment_file: str, start_time: float, end_time: float) -> Dict:
    """
    Processes a single audio segment: transcribes it and returns the result.

    Args:
        segment_file (str): Path to the segment audio file.
        start_time (float): Start time of the segment.
        end_time (float): End time of the segment.

    Returns:
        Dict: A dictionary containing the transcribed text and timestamps.
    """
    result = await asyncio.to_thread(whisper_model.transcribe, segment_file)
    return {
        "text": result["text"],
        "start_time": start_time,
        "end_time": end_time,
    }

async def process_video(
    url, user_api_key, timestamps, segment_wise_q_no, segment_wise_q_model
):
    """
    Processes a single YouTube video to extract its transcript, segment it, and generate questions.

    Args:
        url (str): The YouTube video URL.
        user_api_key (str): The API key for accessing the Gemini model.
        timestamps (List[int]): The timestamps at which to segment the transcript.
        segment_wise_q_no (List[int]): The number of questions to generate for each segment.
        segment_wise_q_model (List[str]): The type of questions to generate for each segment.

    Returns:
        JSONResponse: A JSON response containing the video title, description, segments, and generated questions.

    Raises:
        HTTPException: If the YouTube URL is invalid or if an error occurs during processing.
    """
    video_id = extract_video_id(url)
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")
    transcript = await get_raw_transcript(video_id)

    # Fetch video title, description and transcript
    yt = YouTube(url, 'WEB', on_progress_callback=on_progress)
    title = yt.title
    description = hide_urls(yt.description)

    if transcript == []:
        # Download audio if transcript is not available
        unique_id = str(uuid.uuid4())[:8]  # Shorten UUID for brevity
        m4a_file = f"{unique_id}"
        wav_file = f"{unique_id}.wav"
        print(f"Downloading audio from YouTube video: {yt.title}")
        ys = yt.streams.get_audio_only()
        ys.download(filename=m4a_file)
        print(f"Downloaded audio file: {m4a_file}")

        # Convert audio to WAV format
        print(f"Converting audio file to WAV format: {wav_file}")
        ffmpeg.input(m4a_file).output(wav_file).run()
        print(f"Converted audio file to WAV format: {wav_file}")

        print("Splitting audio into segments...")
        audio_data, samplerate = sf.read(wav_file)
        audio_duration = len(audio_data) / samplerate

        if timestamps == []:
            timestamps = [i * (audio_duration // 4) for i in range(4)]

        timestamps = sorted(timestamps)
        timestamps.append(
            audio_duration + 1
        )  # Ensure last timestamp is the duration of the audio

        segments = []

        for i in range(len(timestamps) - 1):
            start_time = timestamps[i]
            end_time = timestamps[i + 1]

            # Get the segment data based on the timestamps
            start_sample = int(start_time * samplerate)
            end_sample = int(end_time * samplerate)
            segment_data = audio_data[start_sample:end_sample]

            segment_file = f"{wav_file}_{i}.wav"

            # Save the segment to a file
            sf.write(segment_file, segment_data, samplerate)
            print(f"Segment {i + 1} saved: {segment_file}")

            # Transcribe the segment using Whisper
            segment = await process_audio(segment_file, start_time, end_time)
            segments.append(segment)
            await aiofiles.os.remove(segment_file)

        # Clean up temporary files
        await aiofiles.os.remove(wav_file)
        await aiofiles.os.remove(m4a_file)
        print("Audio segments processed successfully.")

        full_transcript = " ".join([segment["text"] for segment in segments])
        upload_result = await upload_text(full_transcript, title)
        print("Upload result:", upload_result)

        # Generate questions for each segment
        questions = []
        for i, segment in enumerate(segments):
            questions_response = await generate_questions_from_prompt(
                segment["text"],
                user_api_key,
                segment_wise_q_no[i],
                segment_wise_q_model[i],
            )
            question_data = parse_llama_json(questions_response)
            print(question_data)

            if "case_study" in question_data:
                case_study_text = question_data.pop(
                    "case_study"
                )  # Remove "case_study" key and get its text
                for question in question_data["questions"]:
                    # Convert the options list to individual option fields
                    options = question.pop("options")  # Remove the options list
                    for j, option in enumerate(options, 1):
                        question[f"option_{j}"] = option
                    
                    # Append case study text to the question's "question" field
                    question["question"] = (
                        f"Case study:\n{case_study_text}\nQuestion:\n{question['question']}"
                    )
                    question["segment"] = i + 1  # Link the question to the segment
                    questions.append(question)
            else:
                # Handle case where "case_study" is not present
                for question in question_data["questions"]:
                    # Convert the options list to individual option fields
                    options = question.pop("options")  # Remove the options list
                    for j, option in enumerate(options, 1):
                        question[f"option_{j}"] = option
                        
                    question["segment"] = i + 1  # Link the question to the segment
                    questions.append(question)

        for seg in segments:
            seg["title"]=title
            seg["video_url"]=url
            seg["description"]=description
        output = VideoResponse(
            segments=segments,
            questions=questions,
        ).model_dump()

        return JSONResponse(content=output)

    else:
        # Segment the transcript
        segments = generate_transcript_segments(transcript, timestamps)

        full_transcript = " ".join([segment["text"] for segment in segments])
        upload_result = await upload_text(full_transcript, title)
        print("Upload result:", upload_result)

        # Generate questions for each segment
        questions = []
        for i, segment in enumerate(segments):
            questions_response = await generate_questions_from_prompt(
                segment["text"],
                user_api_key,
                segment_wise_q_no[i],
                segment_wise_q_model[i],
            )
            question_data = parse_llama_json(questions_response)
            print(question_data)

            if "case_study" in question_data:
                case_study_text = question_data.pop(
                    "case_study"
                )  # Remove "case_study" key and get its text
                for question in question_data["questions"]:
                    # Convert the options list to individual option fields
                    options = question.pop("options")  # Remove the options list
                    for j, option in enumerate(options, 1):
                        question[f"option_{j}"] = option
                    
                    # Append case study text to the question's "question" field
                    question["question"] = (
                        f"Case study:\n{case_study_text}\nQuestion:\n{question['question']}"
                    )
                    question["segment"] = i + 1  # Link the question to the segment
                    questions.append(question)
            else:
                # Handle case where "case_study" is not present
                for question in question_data["questions"]:
                    # Convert the options list to individual option fields
                    options = question.pop("options")  # Remove the options list
                    for j, option in enumerate(options, 1):
                        question[f"option_{j}"] = option
                        
                    question["segment"] = i + 1  # Link the question to the segment
                    questions.append(question)
        for seg in segments:
            seg["title"]=title
            seg["video_url"]=url
            seg["description"]=description
        # Return the processed data
        print("processing pending")
        output = VideoResponse(
            segments=segments,
            questions=questions,
        ).model_dump()
        print("processing_complete")

        return JSONResponse(content=output)