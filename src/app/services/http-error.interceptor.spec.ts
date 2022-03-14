import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { HttpErrorCategory, HttpErrorInterceptor, PARSER } from './http-error.interceptor';
import { HttpTimeoutInterceptor } from './http-timeout.interceptor';

describe('HttpErrorInterceptor', () => {
  let controller: HttpTestingController;
  let http: HttpClient;
  let errors: { [key in HttpErrorCategory]: boolean };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{
        provide: PARSER,
        useValue: ({ error, result }: { error?: string, result?: {} }) => {
          return { body: result, code: error || false };
        }
      }, {
        provide: HTTP_INTERCEPTORS,
        multi: true,
        useClass: HttpErrorInterceptor
      }, {
        provide: HTTP_INTERCEPTORS,
        multi: true,
        useClass: HttpTimeoutInterceptor
      }]
    });

    controller = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
    errors = {
      [HttpErrorCategory.connectionRefused]: false,
      [HttpErrorCategory.errorCode]: false,
      [HttpErrorCategory.invalidResponse]: false,
      [HttpErrorCategory.statusCode]: false,
      [HttpErrorCategory.timedOut]: false
    };
  });

  it('should account for all error categories', () => {
    const count = Object.keys(HttpErrorCategory).length;
    expect(Object.keys(errors).length).toBe(count);
  })

  it('shouldn\'t declare errors on success', () => {
    const next = jasmine.createSpy('next');
    http.get('/', { observe: 'response' }).subscribe(next);
    controller.expectOne('/').flush('');

    expect(next).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalledWith(jasmine.objectContaining(errors));
  });

  it('should declare when a request times out', fakeAsync(() => {
    const error = jasmine.createSpy('error');
    http.get('/').subscribe({ error });
    tick(30000);

    errors.timedOut = true;
    expect(error).toHaveBeenCalledWith(jasmine.objectContaining(errors));
  }));

  it('should declare when a request\'s connection is refused', fakeAsync(() => {
    const error = jasmine.createSpy('error');
    http.get('/').subscribe({ error });
    controller.expectOne('/').error(new ProgressEvent('ConnectionRefused'), { status: 0 });

    errors.connectionRefused = true;
    expect(error).toHaveBeenCalledWith(jasmine.objectContaining(errors));
  }));

  it('should declare when a request\'s response is invalid', fakeAsync(() => {
    const error = jasmine.createSpy('error');
    http.get('/').subscribe({ error });

    const event: ProgressEvent & { error?: Error } = new ProgressEvent('ConnectionRefused');
    event.error = new Error();
    controller.expectOne('/').error(event, { status: 500 });

    errors.invalidResponse = true;
    expect(error).toHaveBeenCalledWith(jasmine.objectContaining(errors));
  }));

  it('should declare when a request fails with an application code', fakeAsync(() => {
    const error = jasmine.createSpy('error');
    http.get('/').subscribe({ error });

    const content = { error: 1, result: {} };
    const event: ProgressEvent & { error?: number, result?: {} } = new ProgressEvent('ConnectionRefused');
    Object.assign(event, content);
    controller.expectOne('/').error(event, { status: 500 });

    errors.errorCode = true;
    expect(error).toHaveBeenCalledWith(jasmine.objectContaining(errors));
    expect(error).toHaveBeenCalledWith(jasmine.objectContaining({ body: content.result, code: content.error }));
  }));

  it('should declare an invalid response when the parser fails', fakeAsync(() => {
    const error = jasmine.createSpy('error');
    http.get('/').subscribe({ error });

    const content = { error: null, result: {} };
    const event: ProgressEvent & { error?: number, result?: {} } = new ProgressEvent('ConnectionRefused');
    Object.assign(event, content);
    controller.expectOne('/').error(event, { status: 500 });

    errors.invalidResponse = true;
    expect(error).toHaveBeenCalledWith(jasmine.objectContaining(errors));
  }));

  it('should declare a request failed with status code when an application code is not found', fakeAsync(() => {
    const error = jasmine.createSpy('error');
    http.get('/').subscribe({ error });

    const content = { error: true, result: {} };
    const event: ProgressEvent & { error?: number, result?: {} } = new ProgressEvent('ConnectionRefused');
    Object.assign(event, content);
    controller.expectOne('/').error(event, { status: 500 });

    errors.statusCode = true;
    expect(error).toHaveBeenCalledWith(jasmine.objectContaining(errors));
  }));
});
