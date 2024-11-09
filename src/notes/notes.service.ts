import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Note } from '../entities/note.entity';
import { Repository, In } from 'typeorm';
import { Tag } from '../entities/tag.entity';
import { NoteTag } from '../entities/note_tag.entity';
import { Topic } from '../entities/topic.entity';
import { SpacesService } from '../spaces/spaces.service';
import { TopicUserRole } from '../entities/topic_user_role.entity';
import { UserSpaceRole } from '../entities/user_space_role.entity';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note) private notesRepository: Repository<Note>,
    @InjectRepository(Tag) private tagsRepository: Repository<Tag>,
    @InjectRepository(NoteTag)
    private noteTagsRepository: Repository<NoteTag>,
    @InjectRepository(Topic) private topicsRepository: Repository<Topic>,
    @InjectRepository(TopicUserRole)
    private topicUserRolesRepository: Repository<TopicUserRole>,
    @InjectRepository(UserSpaceRole)
    private userSpaceRolesRepository: Repository<UserSpaceRole>,
    private readonly spacesService: SpacesService,
  ) {}

  async createNote(userId: number, createNoteDto: any): Promise<any> {
    const { text, tags = [], parentId = null, topicId } = createNoteDto;

    let finalTopicId = topicId;

    if (parentId) {
      // Get the parent note to retrieve topicId if not provided
      const parentNote = await this.notesRepository.findOne({
        where: { id: parentId },
      });

      if (!parentNote) {
        throw new NotFoundException('Parent note not found');
      }

      if (!finalTopicId) {
        finalTopicId = parentNote.topic_id;
      } else if (finalTopicId !== parentNote.topic_id) {
        throw new BadRequestException(
          'Provided topicId does not match parent note topic',
        );
      }
    }

    if (!finalTopicId) {
      throw new BadRequestException(
        'topicId is required when parentId is not provided',
      );
    }

    // Fetch the topic
    const topic = await this.topicsRepository.findOne({
      where: { id: finalTopicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Check if user has permission
    const hasPermission = await this.spacesService.hasPermission(
      userId,
      topic.space_id,
      'CREATE_NOTES',
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to create notes in this topic',
      );
    }

    const note = this.notesRepository.create({
      text,
      parent_id: parentId,
      user_id: userId,
      topic_id: finalTopicId,
    });
    const savedNote = await this.notesRepository.save(note);

    await this.handleTags(savedNote.id, tags);

    return this.getNoteById(savedNote.id, userId);
  }

  async deleteNote(userId: number, noteId: number): Promise<any> {
    const note = await this.notesRepository.findOne({
      where: { id: noteId },
      relations: ['topic'],
    });
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.user_id !== userId) {
      // Check if user has DELETE_NOTES permission
      const hasPermission = await this.spacesService.hasPermission(
        userId,
        note.topic.space_id,
        'DELETE_NOTES',
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          'You do not have permission to delete this note',
        );
      }
    }

    note.is_deleted = true;
    await this.notesRepository.save(note);
    return this.getNoteById(noteId, userId);
  }

  async restoreNote(userId: number, noteId: number): Promise<any> {
    const note = await this.notesRepository.findOne({
      where: { id: noteId },
      relations: ['topic'],
    });
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Check if user has permission
    const hasPermission = await this.spacesService.hasPermission(
      userId,
      note.topic.space_id,
      'EDIT_NOTES',
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to restore this note',
      );
    }

    note.is_deleted = false;
    await this.notesRepository.save(note);
    return this.getNoteById(noteId, userId);
  }

  async updateNote(
    userId: number,
    noteId: number,
    updateNoteDto: any,
  ): Promise<any> {
    const note = await this.notesRepository.findOne({
      where: { id: noteId },
      relations: ['topic'],
    });
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.user_id !== userId) {
      // Check if user has EDIT_NOTES permission
      const hasPermission = await this.spacesService.hasPermission(
        userId,
        note.topic.space_id,
        'EDIT_NOTES',
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          'You do not have permission to edit this note',
        );
      }
    }

    const { text, tags = [], parentId = null } = updateNoteDto;
    note.text = text;
    note.parent_id = parentId;
    await this.notesRepository.save(note);

    await this.noteTagsRepository.delete({ note_id: noteId });
    await this.handleTags(noteId, tags);

    return this.getNoteById(noteId, userId);
  }

  async getNoteById(noteId: number, userId: number): Promise<any> {
    const note = await this.notesRepository.findOne({
      where: { id: noteId },
      relations: ['topic'],
    });
    if (note) {
      // Check if user has permission
      const hasPermission = await this.spacesService.hasPermission(
        userId,
        note.topic.space_id,
        'READ_NOTES',
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          'You do not have permission to read this note',
        );
      }

      const tags = await this.noteTagsRepository.find({
        where: { note_id: noteId },
        relations: ['tag'],
      });
      const tagNames = tags.map((nt) => nt.tag.name);

      const parentNote = note.parent_id
        ? await this.notesRepository.findOne({ where: { id: note.parent_id } })
        : null;

      const replyCount = await this.notesRepository.count({
        where: { parent_id: note.id },
      });

      return {
        id: note.id,
        text: note.text,
        parentId: note.parent_id,
        userId: note.user_id,
        createdAt: note.created_at,
        modifiedAt: note.modified_at,
        parentTextPreview: parentNote
          ? parentNote.text.substring(0, 100)
          : null,
        replyCount,
        tags: tagNames,
      };
    }
    return null;
  }

  async getAllNotes(userId: number, filters: any): Promise<any> {
    const queryBuilder = this.notesRepository.createQueryBuilder('note');

    queryBuilder.where('note.is_deleted = false');

    if (filters.date) {
      queryBuilder.andWhere('note.created_at < :date', { date: filters.date });
    }

    if (filters.parentId !== undefined) {
      queryBuilder.andWhere('note.parent_id = :parentId', {
        parentId: filters.parentId,
      });
    }

    if (filters.notReply) {
      queryBuilder.andWhere('note.parent_id IS NULL');
    }

    if (filters.tags && filters.tags.length > 0) {
      queryBuilder
        .innerJoin('note_tags', 'nt', 'nt.note_id = note.id')
        .innerJoin('tags', 'tag', 'tag.id = nt.tag_id')
        .andWhere('tag.name IN (:...tags)', { tags: filters.tags });
    }

    // If spaceId is not provided but parentId is provided, get spaceId from parent note
    if (!filters.spaceId && filters.parentId) {
      const parentNote = await this.notesRepository.findOne({
        where: { id: filters.parentId },
        relations: ['topic'],
      });

      if (!parentNote) {
        throw new NotFoundException('Parent note not found');
      }

      const topic = await this.topicsRepository.findOne({
        where: { id: parentNote.topic_id },
      });

      if (!topic) {
        throw new NotFoundException('Topic not found for parent note');
      }

      filters.spaceId = topic.space_id;
    } else if (!filters.spaceId) {
      throw new BadRequestException(
        'spaceId is required when parentId is not provided',
      );
    }

    // Check if the user has 'READ_NOTES' permission in the specified space
    const hasPermission = await this.spacesService.hasPermission(
      userId,
      filters.spaceId,
      'READ_NOTES',
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to read notes in this space',
      );
    }

    // Get the user's roles in the space
    const userRoles = await this.spacesService.getUserRolesInSpace(
      userId,
      filters.spaceId,
    );
    const roleIds = userRoles.map((role) => role.id);

    // Get topics the user has access to via topic_user_roles
    const topicUserRoles = await this.topicUserRolesRepository.find({
      where: { role_id: In(roleIds) },
    });
    let accessibleTopicIds = topicUserRoles.map((tur) => tur.topic_id);

    if (filters.topicId) {
      // Check if the topic is in the space and if the user has access to it
      const topic = await this.topicsRepository.findOne({
        where: { id: filters.topicId, space_id: filters.spaceId },
      });
      if (!topic) {
        throw new NotFoundException('Topic not found in the specified space');
      }

      if (!accessibleTopicIds.includes(filters.topicId)) {
        throw new ForbiddenException('You do not have access to this topic');
      }

      queryBuilder.andWhere('note.topic_id = :topicId', {
        topicId: filters.topicId,
      });
    } else {
      // Filter notes by accessible topic IDs
      if (accessibleTopicIds.length > 0) {
        queryBuilder.andWhere('note.topic_id IN (:...topicIds)', {
          topicIds: accessibleTopicIds,
        });
      } else {
        // No accessible topics, return empty result
        return {
          data: [],
          total: 0,
          page: filters.page,
          pageSize: filters.pageSize,
        };
      }
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    queryBuilder.skip(skip).take(take);

    const [notes, total] = await queryBuilder.getManyAndCount();

    const notesWithDetails = [];

    for (const note of notes) {
      const noteDetails = await this.getNoteById(note.id, userId);
      notesWithDetails.push(noteDetails);
    }

    return {
      data: notesWithDetails,
      total,
      page,
      pageSize,
    };
  }

  async handleTags(noteId: number, tags: string[]) {
    for (const tagName of tags) {
      let tag = await this.tagsRepository.findOne({
        where: { name: tagName },
      });
      if (!tag) {
        tag = this.tagsRepository.create({ name: tagName });
        tag = await this.tagsRepository.save(tag);
      }
      const noteTag = this.noteTagsRepository.create({
        note_id: noteId,
        tag_id: tag.id,
      });
      await this.noteTagsRepository.save(noteTag);
    }
  }
}
