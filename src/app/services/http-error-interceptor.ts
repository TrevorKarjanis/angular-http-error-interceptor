import { HttpErrorResponse, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Inject, Injectable, InjectionToken, Optional } from '@angular/core';
import { throwError, TimeoutError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Declare the type of HTTP error that occured.
 */
export enum HttpErrorCategory {
  /** The browsers connection was refused. */
  connectionRefused = 'connectionRefused',
  /** The request failed with an application specific error code. */
  errorCode = 'errorCode',
  /** The response from the server is invalid. */
  invalidResponse = 'invalidResponse',
  /** The request failed with an HTTP status code. */
  statusCode = 'statusCode',
  /** The request timed out. */
  timedOut = 'timedOut'
}

/**
 * Provide additional information about HTTP errors.
 * @see {@link HttpErrorResponse}
 * @property {any} body The body of or return value from the body of the response
 * @property {HttpErrorType} category The type of error that occurred
 * @property {number|string} code The application specific error code
 */
export interface IHttpErrorResponse extends HttpErrorResponse {
  body: any;
  category: HttpErrorCategory;
  code: number | string;
  connectionRefused: boolean;
  errorCode: boolean;
  invalidResponse: boolean;
  statusCode: boolean;
  timedOut: boolean;
}

/**
 * Provide the result of parsing the response.
 */
export interface IHttpParseResult<T> {
  /** The body of or return value from the body of the response */
  body: T;
  /** The application specific error code, false if the response is invalid, or true otherwise */
  code: boolean | number | string;
}

export type Parser = <T>(body: T) => IHttpParseResult<T>;

/**
 * Parse HTTP responses for application specific errors, like error codes passed in body content.
 * @example
 * export function httpErrorParser(body: { name?: string, result?: unknown }) {
 *   return { body: body?.result, code: body?.error ?? true) };
 * }
 */
export const PARSER = new InjectionToken<Parser>('Parser');

/**
 * Intercept HTTP errors to return additional error information.
 */
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  /**
   * @param {function} [parser] A function to extract information from the body of the response
   */
  constructor(@Optional() @Inject(PARSER) private parser: Parser) { }

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(catchError((error: IHttpErrorResponse) => {
      if (error instanceof TimeoutError) {
        error = new HttpErrorResponse({}) as IHttpErrorResponse;
        error.category = HttpErrorCategory.timedOut;
      }

      this.initialize(error);

      // If HttpErrorResponse.error is not an Error, then it is the body.
      //debugger;
      if (error.category === HttpErrorCategory.timedOut) { // Timeout was handled above.
      // The browser sets the status to zero if the connection is refused.
      } else if (error.status === 0) error.category = HttpErrorCategory.connectionRefused;
      // HttpClient returns an instance of Error if the response is invalid.
      // https://github.com/angular/angular/blob/6f1c941dfec8cf0ea0ccbb0fda76f3d960fd843b/packages/common/http/src/xhr.ts#L198
      else if (error.error?.error instanceof Error) {
        error.category = HttpErrorCategory.invalidResponse;
        error.body = error.error.text;
      } else if (this.parser) {
        const { body, code } = this.parser(error.error);
        error.body = body;

        if (code === false) error.category = HttpErrorCategory.invalidResponse;
        else if (typeof code === 'number' || typeof code === 'string') {
          error.category = HttpErrorCategory.errorCode;
          error.code = code;
        } else {
          // Fallback to the HTTP status code if no application specific code was found.
          error.category = HttpErrorCategory.statusCode;
        }
      } else {
        error.body = error.error;
        error.category = HttpErrorCategory.statusCode;
      }

      error[error.category] = true;

      return throwError(error);
    }));
  }

  private initialize(error: IHttpErrorResponse) {
    error[HttpErrorCategory.connectionRefused] = false;
    error[HttpErrorCategory.errorCode] = false;
    error[HttpErrorCategory.invalidResponse] = false;
    error[HttpErrorCategory.statusCode] = false;
    error[HttpErrorCategory.timedOut] = false;
  }
}