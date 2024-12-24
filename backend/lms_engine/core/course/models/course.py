from django.db import models
from django.core.exceptions import ValidationError
from django.db.models import Q

from ...utils.models import TimestampMixin
from ...user.models import User, Roles
from ..constants import COURSE_NAME_MAX_LEN, COURSE_DESCRIPTION_MAX_LEN


class VisibilityChoices(models.TextChoices):
    PUBLIC = 'public', 'Public'
    PRIVATE = 'private', 'Private'
    UNLISTED = 'unlisted', 'Unlisted'

class CourseManager(models.Manager):
    def accessible_by(self, user: User):
        if user.role == Roles.SUPERADMIN:
            return self.all()

        elif user.role == Roles.ADMIN:
            return self.filter(institution_id__in=user.institutions.values_list('id', flat=True))

        elif user.role == Roles.MODERATOR:
            return self.filter(institution_id__in=user.institutions.values_list('id', flat=True))

        elif user.role == Roles.INSTRUCTOR:
            user_institutions = user.institutions.values_list('id', flat=True)

            return self.filter(
                Q(visibility=VisibilityChoices.PUBLIC)
                | Q(institutions__id__in=user_institutions, visibility=VisibilityChoices.PRIVATE)
                | Q(instructors__contains=user)
                )

        elif user.role == Roles.STAFF:
            user_institutions = user.institutions.values_list('id', flat=True)

            return self.filter(
                Q(visibility=VisibilityChoices.PUBLIC)
                | Q(institutions__id__in=user_institutions, visibility=VisibilityChoices.PRIVATE)
            ).union(user.courses.all())

        elif user.role == Roles.STUDENT:
            # Enrolled courses
            return user.courses.all()


class Course(TimestampMixin,models.Model):
    name = models.CharField(max_length=COURSE_NAME_MAX_LEN)
    description = models.TextField(max_length=COURSE_DESCRIPTION_MAX_LEN)
    visibility = models.CharField(
        choices=VisibilityChoices.choices,
        default=VisibilityChoices.PUBLIC.value,
        help_text="Set the visibility of the course."
    )
    institutions = models.ManyToManyField('institution.Institution', related_name='courses')
    instructors = models.ManyToManyField('user.User', through='CourseInstructor', related_name='instructor_courses')

    objects: CourseManager = CourseManager()

    def __str__(self):
        return self.name


class CourseInstructor(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    instructor = models.ForeignKey('user.User', on_delete=models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['course', 'instructor'], name='unique_course_instructor')
        ]

    def clean(self, *args, **kwargs):
        if self.instructor.role != 'instructor':
            raise ValidationError("Only users with the 'instructor' role can be added to the instructors.")
        super().clean(*args, **kwargs)

    def __str__(self):
        return f"{self.instructor} - {self.course}"
