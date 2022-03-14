import { HttpContext, HttpContextToken, HttpErrorResponse, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Inject, Injectable, Optional } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

import { HttpErrorCategory, IHttpErrorResponse } from './http-error.interceptor';
import { HttpErrorDetails, HTTP_ERROR_OPTIONS, IHttpErrorMessages, IHttpErrorOptions, SnackBarConfig } from './http-error-options';
import { Utility } from './utility';

type Message = string | IHttpErrorMessages | false | null;

interface IOptions {
  details?: HttpErrorDetails;
  message?: Message;
  snackBarConfig?: SnackBarConfig;
};

/**
 * Define the error details for an HTTP request.
 * @see HttpErrorMessageInterceptor
 */
export const DETAILS = new HttpContextToken<HttpErrorDetails>(() => null);
/**
 * Define the {@link SnackBarConfig} for an HTTP request's error message.
 * @see HttpErrorMessageInterceptor
 */
export const SNACKBAR_CONFIG = new HttpContextToken<SnackBarConfig>(() => null);
/**
 * Define the primary error message for an HTTP request.
 * @see HttpErrorMessageInterceptor
 */
export const MESSAGE = new HttpContextToken<Message>(() => null);

/**
 * Display error messages for failed HTTP requests. Default generic messages are enabled for all requests by default.
 * Provide {@link HTTP_ERROR_OPTIONS} to configure the feature at the application, module, and component levels. Pass
 * HttpContextTokens to configure individual requests. The message, details, and snack bar are configurable. Define
 * message as {@link IHttpErrorMessages} to provide a message for specific error types. IHttpErrorMessages are merged.
 * Define message as false to disable the feature at any level.
 *
 * @example
 * // Messages are percent formatted with optional error code, status code, URL, method, and category.
 * this.http.get('/', { context: new HttpContext().set(MESSAGE, 'The request for systems failed with status %1.') });
 *
 * @example
 * const message = 'There were insufficient priveleges to save the configuration.';
 * this.http.get('/', { context: new HttpContext().set(MESSAGE, { statusCodes: { 403: message }})});
 *
 * @example
 * // Require configuring messages for every request.
 * providers: [{
 *  provide: HTTP_ERROR_OPTIONS,
 *  useValue: { messages: false }
 * }]
 */
@Injectable()
export class HttpErrorMessageInterceptor implements HttpInterceptor {
  private details = 'URL: %2<br>Method: %3&nbsp&nbspError type: %4';
  /** Provide a default set of generic messages. */
  private messages: IHttpErrorMessages = {
    connectionRefused: 'The request failed, because the connection was refused.',
    errorCode: 'The request failed with error code %0.',
    invalidResponse: 'The request failed with an invalid response.',
    statusCode: 'The request failed with status code %1.',
    timedOut: 'The request timed out.'
  };

  constructor(
    @Optional() @Inject(HTTP_ERROR_OPTIONS) private options: IHttpErrorOptions,
    private snackBar: MatSnackBar
  ) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler) {
    return next.handle(request).pipe(catchError((error: IHttpErrorResponse) => {
      // Client exceptions should propogate normally.
      if (!(error instanceof HttpErrorResponse)) return throwError(error);

      const options = this.getOptions(request.context);
      if (!options.message) return throwError(error);

      let message: string | undefined;
      // Convert the category to pascal case.
      const category = error.category.replace(/^\w/, char => char.toUpperCase());
      const tokens = [error.code, error.status, error.url, error.headers.get('Method'), category];
      if (typeof options.message === 'string') message = Utility.format(options.message, ...tokens);
      else {
        // Prefer the more specific code configuration if it exists.
        if (error.category === HttpErrorCategory.errorCode) message = options.message.errorCodes?.[error.code];
        if (error.category === HttpErrorCategory.statusCode) message = options.message.statusCodes?.[error.status];

        // Fallback to the more general message.
        if (!message) message = (options.message as IHttpErrorMessages)[error.category];
        if (message) message = Utility.format(message, ...tokens);
        else return throwError(error);
      }

      if (options.details) message += `<br>${Utility.format(options.details, ...tokens)}`;

      this.snackBar.open(message, options.snackBarConfig?.action, options.snackBarConfig as MatSnackBarConfig);

      return throwError(error);
    }));
  }

  private getOptions(context: HttpContext): IOptions {
    const options: IOptions = {};
    // Getting a token sets it on the context.
    if (context.has(DETAILS)) options.details = context.get(DETAILS);
    if (context.has(MESSAGE) && context.get(MESSAGE) !== true) options.message = context.get(MESSAGE);
    if (context.has(SNACKBAR_CONFIG)) options.snackBarConfig = context.get(SNACKBAR_CONFIG);

    // Specifically avoid modifying the request and options. It may be reused by the owner. Prefer the request options,
    // then global, and finally the generic defaults.
    return Utility.copyIf(
      options as Record<string, unknown>, 1,
      { details: this.options?.details, message: this.options?.messages, snackBarConfig: this.options?.snackBarConfig },
      { details: this.details, message: this.messages }
    );
  }
}