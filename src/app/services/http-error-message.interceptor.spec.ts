import { HttpClient, HttpContext, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { DETAILS, HttpErrorMessageInterceptor, MESSAGE, SNACKBAR_CONFIG } from './http-error-message.interceptor';
import { HTTP_ERROR_OPTIONS } from './http-error-options';

import { HttpErrorCategory, HttpErrorInterceptor } from './http-error.interceptor';
import { HttpTimeoutInterceptor } from './http-timeout.interceptor';

describe('HttpErrorMessageInterceptor', () => {
  let controller: HttpTestingController;
  let http: HttpClient;
  let errors: { [key in HttpErrorCategory]: boolean };
  // Error observer is required to test error cases.
  const observer = { error: () => {} };
  let globalMessage = 'undefined 0 / null ConnectionRefused<br>undefined 0 / null ConnectionRefused';
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{
        provide: HTTP_ERROR_OPTIONS,
        useValue: { details: '%0 %1 %2 %3 %4', messages: { connectionRefused: '%0 %1 %2 %3 %4' } }
      }, {
        provide: HTTP_INTERCEPTORS,
        multi: true,
        useClass: HttpErrorMessageInterceptor
      }, {
        provide: HTTP_INTERCEPTORS,
        multi: true,
        useClass: HttpErrorInterceptor
      }, {
        provide: HTTP_INTERCEPTORS,
        multi: true,
        useClass: HttpTimeoutInterceptor
      }, {
        provide: MatSnackBar,
        useValue: jasmine.createSpyObj('snackBar', ['open'])
      }]
    });

    controller = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('shouldn\'t display errors on success', () => {
    http.get('/', { observe: 'response' }).subscribe();
    controller.expectOne('/').flush('');

    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('should display a default error when a request times out', fakeAsync(() => {
    http.get('/').subscribe(observer);
    tick(30000);

    const message = 'The request timed out.<br>undefined 0 null null TimedOut';
    expect(snackBar.open).toHaveBeenCalledWith(message, undefined, undefined);
  }));

  it('should display a global error when a request\'s connection is refused', fakeAsync(() => {
    http.get('/').subscribe(observer);
    controller.expectOne('/').error(new ProgressEvent('ConnectionRefused'), { status: 0 });

    expect(snackBar.open).toHaveBeenCalledWith(globalMessage, undefined, undefined);
  }));

  it('should display a configured error when a request\'s response is invalid', fakeAsync(() => {
    const message = 'Test';
    http.get('/', { context: new HttpContext().set(MESSAGE, message).set(DETAILS, message) }).subscribe(observer);

    const event: ProgressEvent & { error?: Error } = new ProgressEvent('ConnectionRefused');
    event.error = new Error();
    controller.expectOne('/').error(event, { status: 500 });

    expect(snackBar.open).toHaveBeenCalledWith(`${message}<br>${message}`, undefined, undefined);
  }));

  it('should display an error with an action when a request fails with an application code', fakeAsync(() => {
    const config = { action: 'Test' };
    http.get('/', { context: new HttpContext().set(SNACKBAR_CONFIG, config) }).subscribe(observer);

    const content = { error: 1, result: {} };
    const event: ProgressEvent & { error?: number, result?: {} } = new ProgressEvent('ConnectionRefused');
    Object.assign(event, content);
    controller.expectOne('/').error(event, { status: 500 });

    const message = 'The request failed with status code 500.<br>undefined 500 / null StatusCode';
    expect(snackBar.open).toHaveBeenCalledWith(message, 'Test', config as MatSnackBarConfig);
  }));
});