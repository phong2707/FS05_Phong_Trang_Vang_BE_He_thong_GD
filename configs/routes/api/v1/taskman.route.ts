import { RailsRoute, action } from 'ts-rails';
import { TaskmanController } from '@controllers/taskman.controller';

export class TaskmanRoute extends RailsRoute {
  public draw() {
    this.get('/subjects/:subjectId/resources', action(TaskmanController, 'list'));
    this.post('/subjects/:subjectId/resources/link', action(TaskmanController, 'createLink'));
    

// ✅ UPLOAD FILE – chỉ gọi controller
    this.post(
      "/subjects/:subjectId/resources/file",
      action(TaskmanController, "createFile")
    );


    this.put('/resources/:id', action(TaskmanController, 'update'));
    this.put('/resources/:id/visibility', action(TaskmanController, 'toggleVisibility'));
    this.delete('/resources/:id', action(TaskmanController, 'delete'));
  }
}