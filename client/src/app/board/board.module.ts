import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MaterialModule } from '../shared/material/material.module';

import { BoardComponent } from './board.component';
import { SocketService } from './shared/services/socket.service';
import { DialogUserComponent } from './dialog-user/dialog-user.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule
  ],
  declarations: [BoardComponent, DialogUserComponent],
  providers: [SocketService],
  entryComponents: [DialogUserComponent]
})
export class BoardModule { }
