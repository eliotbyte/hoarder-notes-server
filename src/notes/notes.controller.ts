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

    // Ensure spaceId is provided
    if (!query.spaceId) {
      throw new BadRequestException('spaceId is a required parameter');
    }

    const filters = {
      date: query.date,
      parentId: query.parentId ? Number(query.parentId) : undefined,
      notReply: query.notReply === 'true',
      tags: query.tags ? query.tags.split(',') : [],
      spaceId: Number(query.spaceId),
      topicId: query.topicId ? Number(query.topicId) : undefined,
      page: query.page ? Number(query.page) : 1,
      pageSize: query.pageSize ? Number(query.pageSize) : 10,
    };

    return this.notesService.getAllNotes(userId, filters);
  }
}
