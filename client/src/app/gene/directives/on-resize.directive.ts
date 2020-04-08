// Angular
import { Directive, ElementRef, EventEmitter, OnDestroy, OnInit, Output }
  from '@angular/core';
// dependencies
import ResizeObserver from "resize-observer-polyfill";


@Directive({
  selector: '[onResize]'
})
export class OnResizeDirective implements OnDestroy, OnInit {

  @Output() onResize = new EventEmitter();

  // variables

  private _resizeObserver;

  constructor(private _el: ElementRef) { }

  // Angular hooks

  ngOnDestroy() {
    this._resizeObserver.disconnect();
  }

  ngOnInit() {
    this._resizeObserver = new ResizeObserver((entries) => {
      this.onResize.emit(entries);
    });
    this._resizeObserver.observe(this._el.nativeElement);
  }

}
