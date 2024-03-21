import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  map: google.maps.Map;
  markerClusterer: MarkerClusterer;
  markerCounter = 0;
  features: google.maps.Data.Feature[];
  zoomLevel: number;
  clusteringLevel: number;
  form: FormGroup;

  ngOnInit(): void {
    this.initMap();
    this.clusteringLevel = 10;
    this.form = new FormGroup({
      clusteringLevel: new FormControl(this.clusteringLevel),
    });
  }

  async initMap() {
    const { AdvancedMarkerElement, PinElement } =
      (await google.maps.importLibrary('marker')) as google.maps.MarkerLibrary;
    this.map = new google.maps.Map(
      document.getElementById('map') as HTMLElement,
      {
        zoom: 3,
        center: { lat: -28.024, lng: 140.887 },
        zoomControl: true,
        mapId: 'DEMO_MAP_ID',
      }
    );
    this.markerClusterer = new MarkerClusterer({ map: this.map });
    this.features = [];
    this.initDrawingManager();
    const zoomLevelElement = document.getElementById('zoom-level');
    this.zoomLevel = this.map.getZoom();
    this.map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(zoomLevelElement);
    const clusterLevel = document.getElementsByTagName('form')[0];
    this.map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(clusterLevel);
    google.maps.event.addListener(this.map, 'zoom_changed', () => {
      this.zoomLevel = this.map.getZoom();
      if (this.map.getZoom() >= this.clusteringLevel) {
        this.markerClusterer.setMap(null);
        this.features.forEach((feature) => {
          this.map.data.add(feature);
        });
      } else {
        this.markerClusterer.setMap(this.map);
        this.features.forEach((feature) => {
          this.map.data.remove(feature);
        });
      }
    });
    for (let i = 0; i < 10000; i++) {
      const lat = -28.024 + Math.random() * 1000;
      const lng = 140.887 + Math.random() * 1000;
      this.addMarker(new google.maps.LatLng({
        lat: lat,
        lng: lng,
      }));
      this.addPolygon(new google.maps.Polygon({
        paths: [
          { lat: lat, lng: lng },
          { lat: lat + 0.1, lng: lng },
          { lat: lat + 0.1, lng: lng + 0.1 },
          { lat: lat, lng: lng + 0.1 },
        ],
      }));
    }
  }

  initDrawingManager() {
    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          google.maps.drawing.OverlayType.MARKER,
          google.maps.drawing.OverlayType.POLYGON,
        ],
      },
      circleOptions: {
        fillColor: '#ffff00',
        fillOpacity: 1,
        strokeWeight: 5,
        clickable: false,
        editable: true,
        zIndex: 1,
      },
    });

    drawingManager.setMap(this.map);

    google.maps.event.addListener(
      drawingManager,
      'overlaycomplete',
      (event) => {
        switch (event.type) {
          case google.maps.drawing.OverlayType.POLYGON:
            const polygon = event.overlay;
            polygon.setMap(null);
            this.addPolygon(polygon);
            break;
          case google.maps.drawing.OverlayType.MARKER:
            const marker = event.overlay;
            marker.setMap(null);
            this.addMarker(marker.getPosition());
            break;
        }
      }
    );
  }

  addMarker(position: google.maps.LatLng) {
    this.markerCounter++;
    const label = 'T' + this.markerCounter;
    const pinGlyph = new google.maps.marker.PinElement({
      glyph: label,
      glyphColor: 'white',
    });
    const marker = new google.maps.marker.AdvancedMarkerElement({
      position,
      content: pinGlyph.element,
    });

    // markers can only be keyboard focusable when they have click listeners
    // open info window when marker is clicked
    marker.addListener('click', () => {
      const infoWindow = new google.maps.InfoWindow({
        content: marker.position.lat + ', ' + marker.position.lng,
        disableAutoPan: true,
      });
      infoWindow.open(this.map, marker);
    });

    // Add a marker clusterer to manage the markers.
    this.markerClusterer.addMarker(marker);
  }

  addPolygon(polygon: google.maps.Polygon) {
    const polygonFeature = new google.maps.Data.Feature({
      geometry: new google.maps.Data.Polygon(
        new Array(polygon.getPath().getArray())
      ),
    });
    this.addMarker(polygon.getPath().getAt(0));
    this.features.push(polygonFeature);
    this.refreshMap();
  }

  onModificaClusterizzazione() {
    this.clusteringLevel = this.form.controls.clusteringLevel.value;
  }

  refreshMap() {
    this.map.setZoom(this.map.getZoom());
  }
}
