// Angular
import { Component,
         ElementRef,
         OnInit,
         ViewChild,
         ViewEncapsulation } from '@angular/core';
import { Observable }        from 'rxjs/Observable';

// App
import { AlignmentService }    from '../../services/alignment.service';
import { FilterService }       from '../../services/filter.service';
import { MicroTracks }         from '../../models/micro-tracks.model';
import { microTracksSelector } from '../../selectors/micro-tracks.selector';
import { PlotsService }        from '../../services/plots.service';

declare var Split: any;
declare var getFamilySizeMap: any;

enum ContentTypes {
  VIEWERS,
  PLOTS
}

@Component({
  moduleId: module.id,
  selector: 'search',
  templateUrl: 'search.component.html',
  styleUrls: [ 'search.component.css' ],
  encapsulation: ViewEncapsulation.None
})

export class SearchComponent implements OnInit {
  // EVIL: ElementRefs nested in switch cases are undefined when parent or child
  // AfterViewInit hooks are called, so routines that depend on them are called
  // via the setter.
  private _splitTop: ElementRef;
  private _splitTopSize = 50;
  @ViewChild('splitTop')
  set splitTop(el: ElementRef) {
    this._splitTop = el;
    this._splitViewers();
  }
  private _splitBottom: ElementRef;
  private _splitBottomSize = 50;
  @ViewChild('splitBottom')
  set splitBottom(el: ElementRef) {
    this._splitBottom = el;
    this._splitViewers();
  }

  contentTypes = ContentTypes;
  content;

  private _microTracks: Observable<MicroTracks>;
  microTracks: MicroTracks;
  familySizes: any;
  microArgs = {
    'highlight': [],
    'geneClicked': function () {},
    'leftAxisClicked': function () {},
    'autoResize': true,
    'boldFirst': true
  };
  legendArgs = {
    'legendClick': function (family) { },
    //'selectiveColoring': this.familySizes
  };

  private _microPlots: Observable<MicroTracks>;
  microPlots: MicroTracks;

  constructor(private _alignmentService: AlignmentService,
              private _filterService: FilterService,
              private _plotsService: PlotsService) { }

  ngOnInit(): void {
    this.showViewers();
    //this.showPlots();
    this._microTracks = Observable.combineLatest(
      this._alignmentService.tracks,
      this._filterService.regexp,
      this._filterService.order
    ).let(microTracksSelector({skipFirst: true}));
    this._microTracks.subscribe(tracks => {
      this.familySizes = getFamilySizeMap(tracks);
      this.microTracks = tracks;
    });
    this._microPlots = Observable.combineLatest(
      this._plotsService.localPlots,
      this._filterService.regexp,
      this._filterService.order
    ).let(microTracksSelector({skipFirst: true}));
    this._microPlots.subscribe(plots => {
      this.microPlots = plots;
    });
  }

  showViewers(): void {
    this.content = this.contentTypes.VIEWERS;
  }

  showPlots(): void {
    this.content = this.contentTypes.PLOTS;
    this._splitTop = this.splitBottom = undefined;
  }

  private _splitViewers(): void {
    if (this._splitTop !== undefined && this._splitBottom !== undefined) {
      let topEl = this._splitTop.nativeElement,
          bottomEl = this._splitBottom.nativeElement;
      let parseSize = (el): number => {
        let regexp = new RegExp(/calc\(|\%(.*)/, 'g');
        return parseFloat(el.style.height.replace(regexp, ''));
      }
      Split([topEl, bottomEl], {
        sizes: [this._splitTopSize, this._splitBottomSize],
        direction: 'vertical',
        minSize: 0,
        onDragEnd: () => {
          this._splitTopSize = parseSize(topEl);
          this._splitBottomSize = parseSize(bottomEl);
        }
      });
    }
  }
}
