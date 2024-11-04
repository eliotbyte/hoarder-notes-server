import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Note } from '../entities/note.entity';
import { Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity';
import { NoteTag } from '../entities/note_tag.entity';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note) private notesRepository: Repository<Note>,
    @InjectRepository(Tag) private tagsRepository: Repository<Tag>,
    @InjectRepository(NoteTag)
    private noteTagsRepository: Repository<NoteTag>,
  ) {}

  async createNote(userId: number, createNoteDto: any): Promise<any> {
    const { text, tags = [], parentId = null } = createNoteDto;
    const note = this.notesRepository.create({
      text,
      parent_id: parentId,
      user_id: userId,
    });
    const savedNote = await this.notesRepository.save(note);

    await this.handleTags(savedNote.id, tags);

    return this.getNoteById(savedNote.id);
  }

  async deleteNote(userId: number, noteId: number): Promise<any> {
    const note = await this.notesRepository.findOne({
      where: { id: noteId, user_id: userId },
    });
    if (note) {
      note.is_deleted = true;
      await this.notesRepository.save(note);
      return this.getNoteById(noteId);
    }
    return null;
  }

  async restoreNote(userId: number, noteId: number): Promise<any> {
    const note = await this.notesRepository.findOne({
      where: { id: noteId, user_id: userId },
    });
    if (note) {
      note.is_deleted = false;
      await this.notesRepository.save(note);
      return this.getNoteById(noteId);
    }
    return null;
  }

  async updateNote(
    userId: number,
    noteId: number,
    updateNoteDto: any,
  ): Promise<any> {
    const note = await this.notesRepository.findOne({
      where: { id: noteId, user_id: userId },
    });
    if (note) {
      const { text, tags = [], parentId = null } = updateNoteDto;
      note.text = text;
      note.parent_id = parentId;
      await this.notesRepository.save(note);

      await this.noteTagsRepository.delete({ note_id: noteId });
      await this.handleTags(noteId, tags);

      return this.getNoteById(noteId);
    }
    return null;
  }

  async getNoteById(noteId: number): Promise<any> {
    const note = await this.notesRepository.findOne({
      where: { id: noteId },
    });
    if (note) {
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

  async getAllNotes(filters: any): Promise<any[]> {
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

    const notes = await queryBuilder.getMany();

    const notesWithDetails = [];

    for (const note of notes) {
      const noteDetails = await this.getNoteById(note.id);
      notesWithDetails.push(noteDetails);
    }

    return notesWithDetails;
  }

  private async handleTags(noteId: number, tags: string[]) {
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
