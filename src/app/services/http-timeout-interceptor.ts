import { HttpContextToken, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { timeout } from 'rxjs/operators';

/**
 * Define a timeout for HTTP requests. Default to 30 seconds. Configure it by passing a timeout to the request context.
 * [HttpContext Documentation]{@link https://angular.io/guide/http#passing-metadata-to-interceptors}
 * @example
 * this.http.get('/resource', { context: new HttpContext().set(TIMEOUT, 10000) });
 */
export const TIMEOUT = new HttpContextToken(() => 30000);

/**
 * Add a timeout to HTTP requests. 
 */
@Injectable()
export class TimeoutInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler) {
    const value = request.context.get(TIMEOUT);
    return next.handle(request).pipe(timeout(value));
  }
}