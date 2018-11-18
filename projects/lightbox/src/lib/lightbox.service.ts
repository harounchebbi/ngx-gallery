import { ComponentRef, Inject, Injectable } from '@angular/core';
import { ComponentPortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef, OverlayConfig } from '@angular/cdk/overlay';
import { LEFT_ARROW, RIGHT_ARROW, ESCAPE } from '@angular/cdk/keycodes';
import { Gallery } from '@ngx-gallery/core';
import { Subject } from 'rxjs';

import { LIGHTBOX_CONFIG } from './lightbox.token';
import { LightboxConfig } from './lightbox.model';
import { defaultConfig } from './lightbox.default';
import { LightboxComponent } from './lightbox.component';

@Injectable({
  providedIn: 'root'
})
export class Lightbox {

  /** Gallery overlay ref */
  private _overlayRef: OverlayRef;

  /** Global config */
  private _config: LightboxConfig;

  /** Stream that emits when lightbox is opened */
  opened = new Subject<string>();

  /** Stream that emits when lightbox is closed */
  closed = new Subject<string>();

  constructor(@Inject(LIGHTBOX_CONFIG) config: LightboxConfig, private _gallery: Gallery, private _overlay: Overlay) {
    this._config = {...defaultConfig, ...config};
  }

  /**
   * Set Lightbox Config
   * @param config - LightboxConfig
   */
  setConfig(config: LightboxConfig) {
    this._config = {...this._config, ...config};
  }

  /**
   * Open Lightbox Overlay
   * @param i - Current Index
   * @param id - Gallery ID
   * @param config - Lightbox Config
   */
  open(i = 0, id = 'lightbox', config?: LightboxConfig) {

    const _config = config ? {...this._config, ...config} : this._config;

    const overlayConfig: OverlayConfig = {
      backdropClass: _config.backdropClass,
      panelClass: _config.panelClass,
      hasBackdrop: _config.hasBackdrop,
      positionStrategy: this._overlay.position().global().centerHorizontally().centerVertically(),
      scrollStrategy: this._overlay.scrollStrategies.block(),
      disposeOnNavigation: true
    };

    const galleryRef = this._gallery.ref(id);
    galleryRef.set(i);

    this._overlayRef = this._overlay.create(overlayConfig);

    // overlay opened event
    this._overlayRef.attachments().subscribe(() => this.opened.next(id));

    // overlay closed event
    this._overlayRef.detachments().subscribe(() => this.closed.next(id));

    // Attach gallery to the overlay
    const galleryPortal = new ComponentPortal(LightboxComponent);
    const lightboxRef: ComponentRef<LightboxComponent> = this._overlayRef.attach(galleryPortal);

    lightboxRef.instance.id = id;
    lightboxRef.instance.overlayRef = this._overlayRef;
    lightboxRef.instance.closeIcon = this._config.closeIcon;
    lightboxRef.instance.role = this._config.role;
    lightboxRef.instance.ariaLabel = this._config.ariaLabel;
    lightboxRef.instance.ariaLabelledBy = this._config.ariaLabelledBy;
    lightboxRef.instance.ariaDescribedBy = this._config.ariaDescribedBy;

    if (_config.hasBackdrop) {
      this._overlayRef.backdropClick().subscribe(() => this.close());
    }

    // Add keyboard shortcuts
    if (_config.keyboardShortcuts) {
      this._overlayRef.keydownEvents().subscribe((event: any) => {
        switch (event.keyCode) {
          case LEFT_ARROW:
            galleryRef.prev();
            break;
          case RIGHT_ARROW:
            galleryRef.next();
            break;
          case ESCAPE:
            this.close();
        }
      });
    }
  }

  /**
   * Close Lightbox Overlay
   */
  close() {
    if (this._overlayRef.hasAttached()) {
      this._overlayRef.detach();
    }
  }
}
