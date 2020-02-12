// Angular + dependencies
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy,
  Output, ViewChild } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { saveFile } from '@gcv/core/utils';
import { MicroTracksService } from '@gcv/gene/services';
import { getMacroColors } from '@gcv/gene/utils';
import { macroLegendShim } from './macro-legend.shim';


@Component({
  selector: 'macro-legend',
  styleUrls: ['../golden-viewer.scss'],
  template: `
    <context-menu (saveImage)="saveImage()"></context-menu>
    <div class="viewer" #container></div>
  `,
})
export class MacroLegendComponent implements AfterViewInit, OnDestroy {

  @Input() options: any = {};
  @Output() click = new EventEmitter();

  @ViewChild('container', {static: true}) container: ElementRef;

  private _destroy: Subject<boolean> = new Subject();
  private _viewer;

  constructor(private _microTracksService: MicroTracksService) { }

  // Angular hooks

  ngAfterViewInit() {
    // fetch own data because injected components don't have change detection
    const selectedTracks = this._microTracksService.getSelectedTracks();
    const tracks = this._microTracksService.getAllTracks();
    combineLatest(selectedTracks, tracks)
      .pipe(takeUntil(this._destroy))
      .subscribe(([queries, tracks]) => this._draw(queries, tracks));
  }

  ngOnDestroy() {
    this._destroy.next(true);
    this._destroy.complete();
    this._destroyViewer();
  }

  // public

  emitClick(key) {
    this.click.emit(key);
  }

  saveImage(): void {
    if (this._viewer !== undefined) {
      saveFile('macro-legend', this._viewer.xml(), 'image/svg+xml', 'svg');
    }
  }

  // private

  private _destroyViewer(): void {
    if (this._viewer !== undefined) {
      this._viewer.destroy();
    }
  }

  private _draw(queries, tracks): void {
    this._destroyViewer();
    const {data, highlight} = macroLegendShim(queries, tracks);
    let colors = getMacroColors(queries);
    if (colors === undefined) {
      colors = (organism) => '#000000';
    }
    let options = {highlight, selector: 'organism'};
    options = Object.assign(options, this.options);
    this._viewer = new GCV.visualization.Legend(
        this.container.nativeElement,
        colors,
        data,
        options);
  }
}