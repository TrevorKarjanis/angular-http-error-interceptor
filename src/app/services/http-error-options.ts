import { InjectionToken } from "@angular/core";
import { MatSnackBarConfig } from "@angular/material/snack-bar";

/**
 * Configure the message for each HTTP error type.
 * {@see HttpErrorCategory}
 */
 export interface IHttpErrorMessages {
  connectionRefused?: string;
  errorCode?: string;
  errorCodes?: { [code: number | string]: string }
  invalidResponse?: string;
  statusCode?: string;
  statusCodes?: { [code: number]: string }
  timedOut?: string;
}

export type HttpErrorDetails = string | false | null;

export type SnackBarConfig = MatSnackBarConfig & { action: string } | null | undefined;

/**
 * Configure error options are the module or component specific level.
 * @see HttpErrorMessageInterceptor
 * */
export interface IHttpErrorOptions {
  /**
   * Configure an error details message.
   */
  details?: HttpErrorDetails;
  /** Configure a set of error messages that will be merged with the generic defaults. Configure as false to disable error messages. */
  messages?: IHttpErrorMessages | false;
  /** Configure the {@link SnackBarConfig} for HTTP request error messages. */
  snackBarConfig?: SnackBarConfig;
  /** Configure the default timeout length in milliseconds for all HTTP requests. Specify false to disable timeouts. */
  timeout?: number | false;
}

export const DEFAULT_HTTP_TIMEOUT = 30000;

export const HTTP_ERROR_OPTIONS = new InjectionToken<IHttpErrorOptions>('HTTP Error Options');