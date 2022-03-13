import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppComponent } from './app.component';
import { HttpErrorInterceptor } from './services/http-error-interceptor';
import { TimeoutInterceptor } from './services/http-timeout-interceptor';

@NgModule({
  imports:      [
    BrowserModule,
    FormsModule
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
    useClass: TimeoutInterceptor
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
