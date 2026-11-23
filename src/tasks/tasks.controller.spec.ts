import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

const tasksServiceMock = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
};

describe('TasksController', () => {
  let controller: TasksController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: tasksServiceMock }],
    }).compile();
    controller = module.get<TasksController>(TasksController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debe delegar la creacion al servicio', async () => {
    const dto = { title: 'Tarea simulada', userId: '6af691f7ad6c0c0e2753eaf2' };
    tasksServiceMock.create.mockResolvedValue({
      _id: 'task789',
      ...dto,
      completed: false,
    });

    const result = await controller.create(dto);

    expect(tasksServiceMock.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ _id: 'task789', ...dto, completed: false });
  });

  it('debe listar las tareas', async () => {
    tasksServiceMock.findAll.mockResolvedValue([
      { _id: 'task789', title: 'Tarea simulada' },
    ]);

    const result = await controller.findAll();

    expect(tasksServiceMock.findAll).toHaveBeenCalled();
    expect(result).toEqual([{ _id: 'task789', title: 'Tarea simulada' }]);
  });
});
