import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AppComponent } from './app.component';
import { HttpErrorInterceptor } from './services/http-error.interceptor';
import { HttpTimeoutInterceptor } from './services/http-timeout.interceptor';

@NgModule({
  imports:      [
    BrowserModule,
    FormsModule,
    MatSnackBarModule
  ],
  declarations: [
    AppComponent
  ],
  providers: [{
    provide: HTTP_INTERCEPTORS,
    multi: true,
    useClass: HttpErrorInterceptor
  }, {
    provide: HTTP_INTERCEPTORS,
    multi: true,
    useClass: HttpTimeoutInterceptor
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
