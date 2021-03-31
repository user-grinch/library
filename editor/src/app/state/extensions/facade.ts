import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs/operators';
import { Command, Extension, Game } from '../../models';
import { updateCommand, toggleExtension, loadExtensions } from './actions';
import * as selector from './selectors';

@Injectable({ providedIn: 'root' })
export class ExtensionsFacade {
  extensions$ = this.store$
    .select(selector.extensions)
    .pipe(filter<Extension[]>(Boolean));

  extensionNames$ = this.store$.select(selector.extensionNames);
  loading$ = this.store$.select(selector.loading);
  lastUpdate$ = this.store$.select(selector.lastUpdate);

  getExtensionCheckedState(extension: string) {
    return this.store$.select(selector.selectedExtensions, {
      extension,
    });
  }

  getExtensionEntities(extension: string) {
    return this.store$.select(selector.entities, { extension });
  }

  constructor(private store$: Store) {}

  updateCommand({
    command,
    newExtension,
    oldExtension,
  }: {
    command: Command;
    newExtension: string;
    oldExtension: string;
  }) {
    this.store$.dispatch(
      updateCommand({ command, newExtension, oldExtension })
    );
  }

  toggleExtension(game: Game, extension: string) {
    this.store$.dispatch(toggleExtension({ game, extension }));
  }

  loadExtensions(game: Game) {
    this.store$.dispatch(loadExtensions({ game }));
  }
}
