// Angular
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild }
  from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { AppConfig } from '@gcv/app.config';
import { saveFile } from '@gcv/core/utils';
import { Track } from '@gcv/gene/models';
import { blockIndexMap, nameSourceID } from '@gcv/gene/models/shims';
import { ChromosomeService, GeneService, PairwiseBlocksService, ParamsService }
  from '@gcv/gene/services';
// component
import { endpointGenesShim, macroCircosShim } from './macro-circos.shim';


@Component({
  selector: 'macro-circos',
  styleUrls: ['../golden-viewer.scss'],
  template: `
    <context-menu (saveImage)="saveImage()"></context-menu>
    <div class="viewer" #container></div>
  `,
})
export class MacroCircosComponent implements AfterViewInit, OnDestroy {

  @Input() clusterID: number;
  @Input() options: any = {};

  @ViewChild('container', {static: true}) container: ElementRef;

  private _destroy: Subject<boolean> = new Subject();
  private _viewer;

  constructor(private _chromosomeService: ChromosomeService,
              private _geneService: GeneService,
              private _pairwiseBlocksService: PairwiseBlocksService,
              private _paramsService: ParamsService) { }

  // Angular hooks

  ngAfterViewInit() {
    const trackID = (track) => `${track.name}:${track.source}`;
    const queryChromosomes = this._chromosomeService
      .getSelectedChromosomesForCluster(this.clusterID);
    const sourceParams = this._paramsService.getSourceParams();
    const blockParams = this._paramsService.getBlockParams();
    const pairwiseBlocks =
      combineLatest(queryChromosomes, sourceParams, blockParams).pipe(
        switchMap(([chromosomes, sources, params]) => {
          const _sources = sources.sources;
          const targets = chromosomes.map((c) => c.name);
          return this._pairwiseBlocksService
            .getPairwiseBlocksForTracks(chromosomes, _sources, params, targets);
        }),
      );
    const blockGenes = combineLatest(queryChromosomes, pairwiseBlocks).pipe(
        map(([chromosomes, blocks]) => {
          const chromosomeGeneIndexes = blockIndexMap(blocks);
          // create chromosome copies that only contain index gene
          const geneChromosomes = chromosomes
            .map((c) => endpointGenesShim(c, chromosomeGeneIndexes));
          return geneChromosomes;
        }),
        switchMap((geneChromosomes) => {
          return this._geneService.getGenesForTracks(geneChromosomes);
        }),
      );
    combineLatest(queryChromosomes, pairwiseBlocks, blockGenes)
      .pipe(takeUntil(this._destroy))
      .subscribe(([chromosomes, blocks, genes]) => {
        this._draw(chromosomes, blocks, genes);
      });
  }

  ngOnDestroy() {
    this._destroy.next(true);
    this._destroy.complete();
    this._destroyViewer();
  }

  // private

  private _destroyViewer(): void {
    if (this._viewer !== undefined) {
      this._viewer.destroy();
    }
  }

  private _getColors(chromosomes): any {
    if (chromosomes.length == 0) {
      return undefined;
    }
    const s: any = AppConfig.getServer(chromosomes[0].source);
    if (s !== undefined && s.macroColors !== undefined) {
      return s.macroColors.function;
    }
    return undefined;
  }

  private _draw(chromosomes, blocks, genes): void {
    const colors = this._getColors(chromosomes);
    this._destroyViewer();
    const data = macroCircosShim(chromosomes, blocks, genes);
    let options = {
      autoResize: true,
      colors,
      //replicateBlocks: true,
    };
    options = Object.assign(options, this.options);
    this._viewer = new GCV.visualization.MultiMacro(
      this.container.nativeElement,
      data,
      options,
    );
  }

  // public

  saveImage(): void {
    if (this._viewer !== undefined) {
      saveFile('macro-circos', this._viewer.xml(), 'image/svg+xml', 'svg');
    }
  }
}
