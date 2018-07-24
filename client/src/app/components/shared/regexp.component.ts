// Angular
import { Component } from "@angular/core";
// App
import { FilterService } from "../../services";

@Component({
  selector: "app-regexp",
  styles: [ "form button { margin-right: 0; }" ],
  template: `
    <form (ngSubmit)="submit()" #regexpForm="ngForm">
      <div class="input-group">
        <input type="text" class="form-control" id="regexp"
          [(ngModel)]="model.regexp" name="regexp"
          #regexp="ngModel"
          placeholder="e.g. name1|name4|name2" >
        <span class="input-group-btn">
          <button class="btn btn-default" type="submit">Filter</button>
        </span>
      </div>
    </form>
  `,
})
export class RegexpComponent {

  model: any = {regexp: ""};

  constructor(private filterService: FilterService) {
    filterService.regexpAlgorithm
      .subscribe((regexp) => this.model.regexp = regexp.name);
  }

  submit(): void {
    this.filterService.setRegexp(this.model.regexp);
  }
}
