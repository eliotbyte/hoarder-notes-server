import {
  Controller,
  Post,
  UseGuards,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notes')
export class NotesController {
  constructor(private notesService: NotesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createNote(@Req() req, @Body() createNoteDto: any) {
    const userId = req.user.userId;
    return this.notesService.createNote(userId, createNoteDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteNote(@Req() req, @Param('id') noteId: number) {
    const userId = req.user.userId;
    return this.notesService.deleteNote(userId, Number(noteId));
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/restore')
  async restoreNote(@Req() req, @Param('id') noteId: number) {
    const userId = req.user.userId;
    return this.notesService.restoreNote(userId, Number(noteId));
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateNote(
    @Req() req,
    @Param('id') noteId: number,
    @Body() updateNoteDto: any,
  ) {
    const userId = req.user.userId;
    return this.notesService.updateNote(userId, Number(noteId), updateNoteDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getNoteById(@Req() req, @Param('id') noteId: number) {
    const userId = req.user.userId;
    return this.notesService.getNoteById(Number(noteId), userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllNotes(@Req() req, @Query() query: any) {
    const userId = req.user.userId;

    // Ensure space_id is provided
    if (!query.space_id) {
      throw new BadRequestException('space_id is a required parameter');
    }

    const filters = {
      date: query.date,
      parent_id: query.parent_id ? Number(query.parent_id) : undefined,
      not_reply: query.not_reply === 'true',
      tags: query.tags ? query.tags.split(',') : [],
      space_id: Number(query.space_id),
      topic_id: query.topic_id ? Number(query.topic_id) : undefined,
    };

    return this.notesService.getAllNotes(userId, filters);
  }
}
