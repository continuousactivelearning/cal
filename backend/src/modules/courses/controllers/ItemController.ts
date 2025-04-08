import {instanceToPlain} from 'class-transformer';
import 'reflect-metadata';
import {
  Authorized,
  BadRequestError,
  Body,
  Get,
  JsonController,
  Params,
  Post,
  Put,
} from 'routing-controllers';
import {CourseRepository} from 'shared/database/providers/mongo/repositories/CourseRepository';
import {UpdateError} from 'shared/errors/errors';
import {HTTPError} from 'shared/middleware/ErrorHandler';
import {Inject, Service} from 'typedi';
import {Item} from '../classes/transformers/Item';
import {
  CreateItemBody,
  UpdateItemBody,
  MoveItemBody,
  CreateItemParams,
  ReadAllItemsParams,
  UpdateItemParams,
  MoveItemParams,
} from '../classes/validators/ItemValidators';
import {calculateNewOrder} from '../utils/calculateNewOrder';

/**
 *
 * @category Courses/Controllers
 */
@JsonController()
@Service()
export class ItemController {
  constructor(
    @Inject('NewCourseRepo') private readonly courseRepo: CourseRepository,
  ) {
    if (!this.courseRepo) {
      throw new Error('CourseRepository is not properly injected');
    }
  }

  @Authorized(['admin'])
  @Post('/versions/:versionId/modules/:moduleId/sections/:sectionId/items')
  async create(
    @Params() params: CreateItemParams,
    @Body() body: CreateItemBody,
  ) {
    try {
      const {versionId, moduleId, sectionId} = params;
      //Fetch Version
      const version = await this.courseRepo.readVersion(versionId);

      //Find Module
      const module = version.modules.find(m => m.moduleId === moduleId);

      //Find Section
      const section = module.sections.find(s => s.sectionId === sectionId);

      //Fetch ItemGroup
      const itemsGroup = await this.courseRepo.readItemsGroup(
        section.itemsGroupId.toString(),
      );

      //Create Item
      const newItem = new Item(body, itemsGroup.items);

      //Add Item to ItemsGroup
      itemsGroup.items.push(newItem);

      //Update Section Update Date
      section.updatedAt = new Date();

      //Update Module Update Date
      module.updatedAt = new Date();

      //Update Version Update Date
      version.updatedAt = new Date();

      const updatedItemsGroup = await this.courseRepo.updateItemsGroup(
        section.itemsGroupId.toString(),
        itemsGroup,
      );

      //Update Version
      const updatedVersion = await this.courseRepo.updateVersion(
        versionId,
        version,
      );

      return {
        itemsGroup: instanceToPlain(updatedItemsGroup),
        version: instanceToPlain(updatedVersion),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new HTTPError(500, error);
      }
    }
  }

  @Authorized(['admin', 'instructor', 'student'])
  @Get('/versions/:versionId/modules/:moduleId/sections/:sectionId/items')
  async readAll(@Params() params: ReadAllItemsParams) {
    try {
      const {versionId, moduleId, sectionId} = params;
      //Fetch Version
      const version = await this.courseRepo.readVersion(versionId);

      //Find Module
      const module = version.modules.find(m => m.moduleId === moduleId);

      //Find Section
      const section = module.sections.find(s => s.sectionId === sectionId);

      //Fetch Items
      const itemsGroup = await this.courseRepo.readItemsGroup(
        section.itemsGroupId.toString(),
      );

      return {
        itemsGroup: itemsGroup,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new HTTPError(500, error);
      }
    }
  }

  @Authorized(['admin'])
  @Put(
    '/versions/:versionId/modules/:moduleId/sections/:sectionId/items/:itemId',
  )
  async update(
    @Params() params: UpdateItemParams,
    @Body() body: UpdateItemBody,
  ) {
    try {
      const {versionId, moduleId, sectionId, itemId} = params;
      //Fetch Version
      const version = await this.courseRepo.readVersion(versionId);

      //Find Module
      const module = version.modules.find(m => m.moduleId === moduleId);

      //Find Section
      const section = module.sections.find(s => s.sectionId === sectionId);

      //Fetch ItemsGroup
      const itemsGroup = await this.courseRepo.readItemsGroup(
        section.itemsGroupId.toString(),
      );

      //Find Item
      const item = itemsGroup.items.find(i => i.itemId === itemId);

      //Update Item
      Object.assign(item, body.name ? {name: body.name} : {});
      Object.assign(
        item,
        body.description ? {description: body.description} : {},
      );
      Object.assign(item, body.type ? {type: body.type} : {});

      //Update Item Details
      Object.assign(
        item,
        body.videoDetails
          ? {itemDetails: body.videoDetails}
          : body.blogDetails
            ? {itemDetails: body.blogDetails}
            : body.quizDetails
              ? {itemDetails: body.quizDetails}
              : {},
      );

      //Update Section Update Date
      section.updatedAt = new Date();

      //Update Module Update Date
      module.updatedAt = new Date();

      //Update Version Update Date
      version.updatedAt = new Date();

      //Update ItemsGroup
      const updatedItemsGroup = await this.courseRepo.updateItemsGroup(
        section.itemsGroupId.toString(),
        itemsGroup,
      );

      //Update Version
      const updatedVersion = await this.courseRepo.updateVersion(
        versionId,
        version,
      );

      return {
        itemsGroup: instanceToPlain(updatedItemsGroup),
        version: instanceToPlain(updatedVersion),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new HTTPError(500, error);
      }
    }
  }

  @Authorized(['admin'])
  @Put(
    '/versions/:versionId/modules/:moduleId/sections/:sectionId/items/:itemId/move',
  )
  async move(@Params() params: MoveItemParams, @Body() body: MoveItemBody) {
    try {
      const {versionId, moduleId, sectionId, itemId} = params;
      const {afterItemId, beforeItemId} = body;

      if (!afterItemId && !beforeItemId) {
        throw new UpdateError('Either afterItemId or beforeItemId is required');
      }

      //Fetch Version
      const version = await this.courseRepo.readVersion(versionId);

      //Find Module
      const module = version.modules.find(m => m.moduleId === moduleId);

      //Find Section
      const section = module.sections.find(s => s.sectionId === sectionId);

      //Fetch ItemsGroup
      const itemsGroup = await this.courseRepo.readItemsGroup(
        section.itemsGroupId.toString(),
      );

      //Find Item
      const item = itemsGroup.items.find(i => i.itemId === itemId);

      //Sort Items based on order
      const sortedItems = itemsGroup.items.sort((a, b) =>
        a.order.localeCompare(b.order),
      );

      //Calculate New Order
      const newOrder = calculateNewOrder(
        sortedItems,
        'itemId',
        afterItemId,
        beforeItemId,
      );

      //Update Item Order
      item.order = newOrder;

      //Change the updatedAt dates
      section.updatedAt = new Date();
      module.updatedAt = new Date();
      version.updatedAt = new Date();

      //Update ItemsGroup
      const updatedItemsGroup = await this.courseRepo.updateItemsGroup(
        section.itemsGroupId.toString(),
        itemsGroup,
      );

      //Update Version
      const updatedVersion = await this.courseRepo.updateVersion(
        versionId,
        version,
      );

      return {
        itemsGroup: instanceToPlain(updatedItemsGroup),
        version: instanceToPlain(updatedVersion),
      };
    } catch (error) {
      if (error instanceof UpdateError) {
        throw new BadRequestError(error.message);
      }
      if (error instanceof Error) {
        throw new HTTPError(500, error);
      }
    }
  }
}
