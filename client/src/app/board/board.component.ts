import { Component, OnInit, ViewChildren, ViewChild, AfterViewInit, QueryList, ElementRef,Input, HostListener } from '@angular/core';
import { MatDialog, MatDialogRef, MatList, MatListItem } from '@angular/material';

import { Observable } from 'rxjs/Observable';

import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/pairwise';
import 'rxjs/add/operator/switchMap';

import { Action } from './shared/model/action';
import { Event } from './shared/model/event';
import { Message } from './shared/model/message';
import { User } from './shared/model/user';
import { SocketService } from './shared/services/socket.service';
import { DialogUserComponent } from './dialog-user/dialog-user.component';
import { DialogUserType } from './dialog-user/dialog-user-type';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import * as Constants from '../constants';

const SERVER_URL = Constants.baseUrl;

@Component({
  selector: 'tcc-chat',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements OnInit, AfterViewInit {

  // a reference to the canvas element from our template
  @ViewChild('canvas') public canvas: ElementRef;

  // setting a width and height for the canvas
  @Input() public width = 1000;
  @Input() public height = 600;
 private cx: CanvasRenderingContext2D;
  action = Action;
  user: User;
  messages: Message[] = [];
  messageContent: string;
  ioConnection: any;
  dialogRef: MatDialogRef<DialogUserComponent> | null;
  defaultDialogUserParams: any = {
    disableClose: true,
    data: {
      title: 'Welcome',
      dialogType: DialogUserType.NEW
    }
  };
  prev: any;
  next: any;

  // getting a reference to the overall list, which is the parent container of the list items
  @ViewChild(MatList, { read: ElementRef }) matList: ElementRef;

  // getting a reference to the items/messages within the list
  @ViewChildren(MatListItem, { read: ElementRef }) matListItems: QueryList<MatListItem>;

  constructor(private socketService: SocketService,
    public dialog: MatDialog,
    private http:HttpClient) { }

  ngOnInit(): void {
    this.initModel();
    setTimeout(() => {
      if(void 0 == localStorage.getItem('username') || localStorage.getItem('username') == null){
          this.openUserPopup(this.defaultDialogUserParams);
      }else{
        let message: Message;
        const randomId = this.getRandomId();
        this.user = {
          id: randomId,
          name: localStorage.getItem('username')
        };
        message = {
          from: this.user,
          action: Action.JOINED
        }
        this.initIoConnection();
        this.loggedInUser();
        this.socketService.send(message);
      }
    }, 0);


  }

  ngAfterViewInit(): void {
    // subscribing to any changes in the list of items / messages
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    this.cx = canvasEl.getContext('2d');

    // set the width and height
    canvasEl.width = this.width;
    canvasEl.height = this.height;

    // set some default properties about the line
    this.cx.lineWidth = 3;
    this.cx.lineCap = 'round';
    this.cx.strokeStyle = '#000';

    // we'll implement this method to start capturing mouse events
    this.captureEvents(canvasEl);

  }

  @HostListener('mouseup')
  onMouseUp() {
    this.saveBoardState();
  }

  saveBoardState(){
    var whiteboardDraw = this.cx.canvas.toDataURL();
    this.http.post(SERVER_URL+'/board',{'name': 'whiteboard', 'board': whiteboardDraw }).subscribe(data => {
      // console.log(data);
    });
  }


  private captureEvents(canvasEl: HTMLCanvasElement) {
  Observable
    // this will capture all mousedown events from teh canvas element
    .fromEvent(canvasEl, 'mousedown')
    .switchMap((e) => {
      return Observable
        // after a mouse down, we'll record all mouse moves
        .fromEvent(canvasEl, 'mousemove')
        // we'll stop (and unsubscribe) once the user releases the mouse
        // this will trigger a 'mouseup' event
        .takeUntil(Observable.fromEvent(canvasEl, 'mouseup'))
        // we'll also stop (and unsubscribe) once the mouse leaves the canvas (mouseleave event)
        .takeUntil(Observable.fromEvent(canvasEl, 'mouseleave'))
        // pairwise lets us get the previous value to draw a line from
        // the previous point to the current point
        .pairwise()
    })
    .subscribe((res: [MouseEvent, MouseEvent]) => {
      const rect = canvasEl.getBoundingClientRect();

      // previous and current position with the offset
      const prevPos = {
        x: res[0].clientX - rect.left,
        y: res[0].clientY - rect.top
      };

      const currentPos = {
        x: res[1].clientX - rect.left,
        y: res[1].clientY - rect.top
      };

      this.socketService.draw({prevPos, currentPos});
      // this method we'll implement soon to do the actual drawing
      this.drawOnCanvas(prevPos, currentPos);
});
}

private drawOnCanvas(
  prevPos: { x: number, y: number },
  currentPos: { x: number, y: number }
) {
  // incase the context is not set
  if (!this.cx) { return; }

  // start our drawing path
  this.cx.beginPath();

  // we're drawing lines so we need a previous position
  if (prevPos) {
    // sets the start point
    this.cx.moveTo(prevPos.x, prevPos.y); // from
    // draws a line from the start pos until the current position
    this.cx.lineTo(currentPos.x, currentPos.y);

    // strokes the current path with the styles we set earlier
    this.cx.stroke();
  }
}

  // auto-scroll fix: inspired by this stack overflow post
  // https://stackoverflow.com/questions/35232731/angular2-scroll-to-bottom-chat-style
  private scrollToBottom(): void {
    try {
      this.matList.nativeElement.scrollTop = this.matList.nativeElement.scrollHeight;
    } catch (err) {
    }
  }

  private initModel(): void {
    const randomId = this.getRandomId();
    this.user = {
      id: randomId
    };
  }

  private initIoConnection(): void {
    this.socketService.initSocket();

    this.ioConnection = this.socketService.onMessage()
      .subscribe((message: Message) => {
        this.messages.push(message);
      });


    this.socketService.onEvent(Event.CONNECT)
      .subscribe(() => {
        console.log('connected');
      });

    this.socketService.onEvent(Event.DISCONNECT)
      .subscribe(() => {
        console.log('disconnected');
      });

    this.socketService.onDraw()
      .subscribe((message: any) => {
          this.drawOnCanvas(message.prevPos, message.currentPos);
      });

    this.socketService.onStrokeStyle()
      .subscribe((data: any) => {
          this.cx.strokeStyle = data.strokeStyle;
          this.cx.lineWidth = data.lineWidth;
      });
    this.socketService.onCanvasClear()
      .subscribe((data: any) => {
          this.clearAll();
      })
  }

  private getRandomId(): number {
    return Math.floor(Math.random() * (1000000)) + 1;
  }

  public onClickUserInfo() {
    this.openUserPopup({
      data: {
        username: this.user.name,
        title: 'Edit Details',
        dialogType: DialogUserType.EDIT
      }
    });
  }

  public setPen(pencolor){
    if(pencolor == 0){
      this.socketService.setStrokeStyle({'strokeStyle':'#FFF', 'lineWidth': 6});
    }
    else if(pencolor == 1){
      this.socketService.setStrokeStyle({'strokeStyle':'#000', 'lineWidth': 3});
    }
  }

  public clearCanvas(){
    this.socketService.clearCanvas();

  }

  public clearAll(){
    const canvas = this.canvas.nativeElement;
    this.cx.clearRect(0, 0, canvas.width, canvas.height);
    this.socketService.setStrokeStyle({'strokeStyle':'#000', 'lineWidth': 3});
    this.saveBoardState();
  }

  private openUserPopup(params): void {
    this.dialogRef = this.dialog.open(DialogUserComponent, params);
    this.dialogRef.afterClosed().subscribe(paramsDialog => {
      if (!paramsDialog) {
        return;
      }

      this.user.name = paramsDialog.username;
      if (paramsDialog.dialogType === DialogUserType.NEW) {
        this.initIoConnection();
        this.sendNotification(paramsDialog, Action.JOINED);
      } else if (paramsDialog.dialogType === DialogUserType.EDIT) {
        this.sendNotification(paramsDialog, Action.RENAME);
      }
      this.loggedInUser();

    });
  }

  public loggedInUser(){

        this.http.get(SERVER_URL+'/board').subscribe(data => {
          var image = new Image();
          var cx = this.cx;
          image.onload = function() {
            cx.drawImage(image, 0, 0);
          };
          image.src = data[0].board;
        });
  }

  public sendMessage(message: string): void {
    if (!message) {
      return;
    }

    this.socketService.send({
      from: this.user,
      content: message
    });
    this.messageContent = null;
  }

  public sendNotification(params: any, action: Action): void {
    let message: Message;
    if (action === Action.JOINED) {
      message = {
        from: this.user,
        action: action
      }
    } else if (action === Action.RENAME) {
      message = {
        action: action,
        content: {
          username: this.user.name,
          previousUsername: params.previousUsername
        }
      };
    }
    localStorage.setItem('username', this.user.name);


    this.socketService.send(message);
  }
}
