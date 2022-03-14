import { HttpClient, HttpContext, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HTTP_ERROR_OPTIONS } from './http-error-options';

import { TIMEOUT, HttpTimeoutInterceptor } from './http-timeout.interceptor';

describe('HttpTimeoutInterceptor', () => {
  let controller: HttpTestingController;
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{
        provide: HTTP_ERROR_OPTIONS,
        useValue: { timeout: 20000 }
      }, {
        provide: HTTP_INTERCEPTORS,
        multi: true,
        useClass: HttpTimeoutInterceptor
      }]
    });

    controller = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
  });

  it('should not throw when a request doesn\'t timeout', fakeAsync(() => {
    const next = jasmine.createSpy('next');
    http.get('/').subscribe(next);
    controller.expectOne('/').flush('');
    expect(next).toHaveBeenCalled();
  }));

  it('should error when a request times out by default', fakeAsync(() => {
    const error = jasmine.createSpy('error');
    http.get('/').subscribe({ error });
    tick(20000);
    expect(error).toHaveBeenCalled();
  }));

  it('should error when a request times out with a custom timeout', fakeAsync(() => {
    const error = jasmine.createSpy('error');
    http.get('/', { context: new HttpContext().set(TIMEOUT, 10000)}).subscribe({ error });
    tick(10000);
    expect(error).toHaveBeenCalled();
  }));
});
