import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'tcc-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  user: String;
  ngOnInit(): void {
  }

  private initModel(): void {
  }
  logoutUser(): void {
    localStorage.clear();
    location.reload();
  }
}
