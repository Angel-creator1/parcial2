import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { UsersService } from '../users/users.service';

const VALID_USER_ID = '6af691f7ad6c0c0e2753eaf2';

const taskModelMock = {
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
};

const usersServiceMock = {
  findById: jest.fn(),
};

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getModelToken('Task'), useValue: taskModelMock },
        { provide: UsersService, useValue: usersServiceMock },
      ],
    }).compile();
    service = module.get<TasksService>(TasksService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear la tarea si el usuario existe', async () => {
      const dto = { title: 'Tarea simulada', userId: VALID_USER_ID };
      usersServiceMock.findById.mockResolvedValue({
        _id: VALID_USER_ID,
        name: 'Ana',
      });
      taskModelMock.create.mockResolvedValue({
        _id: 'task789',
        ...dto,
        completed: false,
      });

      const result = await service.create(dto);

      expect(usersServiceMock.findById).toHaveBeenCalledWith(VALID_USER_ID);
      expect(taskModelMock.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ _id: 'task789', ...dto, completed: false });
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      const dto = {
        title: 'Tarea simulada',
        userId: '600000000000000000000000',
      };
      usersServiceMock.findById.mockRejectedValue(
        new NotFoundException('Usuario no encontrado'),
      );

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(taskModelMock.create).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si el id no es valido', async () => {
      const dto = { title: 'Tarea simulada', userId: 'abc' };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(usersServiceMock.findById).not.toHaveBeenCalled();
    });
  });
});
