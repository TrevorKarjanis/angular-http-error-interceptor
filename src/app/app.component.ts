import { Component, VERSION } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <h1>Hello {{ name }}</h1>
    <p>Start editing to see some magic happen. :)</p>
  `,
  styles: [`
    p {
      font-family: Lato;
    }
  `]
})
export class AppComponent  {
  name = `Angular ${VERSION.major}`;
}