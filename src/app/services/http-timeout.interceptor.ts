import { HttpContextToken, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Inject, Injectable, Optional } from '@angular/core';
import { timeout } from 'rxjs/operators';

import { DEFAULT_HTTP_TIMEOUT, HTTP_ERROR_OPTIONS, IHttpErrorOptions } from './http-error-options';

/**
 * Define the timeout for an HTTP request. Default to 30 seconds. Configure it by passing a timeout to the request context.
 * [HttpContext Documentation]{@link https://angular.io/guide/http#passing-metadata-to-interceptors}
 * @example
 * this.http.get('/resource', { context: new HttpContext().set(TIMEOUT, 10000) });
 */
export const TIMEOUT = new HttpContextToken(() => DEFAULT_HTTP_TIMEOUT);

/**
 * Add a timeout to HTTP requests.
 */
@Injectable()
export class HttpTimeoutInterceptor implements HttpInterceptor {
  constructor(@Optional() @Inject(HTTP_ERROR_OPTIONS) private options: IHttpErrorOptions) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler) {
    const context = request.context;
    if (!context.has(TIMEOUT)) {
      const timeout = this.options?.timeout;
      if (timeout === false) return next.handle(request);
      else if (timeout && timeout !== DEFAULT_HTTP_TIMEOUT) context.set(TIMEOUT, this.options.timeout);
    }

    return next.handle(request).pipe(timeout(context.get(TIMEOUT)));
  }
}