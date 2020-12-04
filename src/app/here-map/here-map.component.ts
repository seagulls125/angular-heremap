import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { debounceTime, tap, switchMap, finalize } from 'rxjs/operators';

declare var H: any;

@Component({
  selector: 'app-here-map',
  templateUrl: './here-map.component.html',
  styleUrls: ['./here-map.component.scss']
})
export class HereMapComponent implements OnInit {


  //reference for map
  @ViewChild("map",{static : true}) public mapElement: ElementRef;

  //credintal information for access heremap api
  @Input() public appId: any;
  @Input() public appCode: any;

  //initial view point
  @Input() public lat: any;
  @Input() public lng: any;

  //map width & height
  @Input() public width: any;
  @Input() public height: any;

  //map container
  private platform: any;
  private map: any;

  //search control gruop
  searchAddressCtrl = new FormControl();
  filteredData: any;
  isLoading = false;
  errorMsg: string;

  //variable for store user's address
  address : any;

  // countryCtrl = new FormControl();
  // options: any[] = countryCode;

  public constructor(private http: HttpClient) { }

  public ngOnInit() {
    this.platform = new H.service.Platform({
      // "apiKey": this.appId,
      "apiKey": this.appCode,
      useHTTPS: true,
      useCIT : false
    });

    //fetch data using httpClient's Observable switchMap(user's typing)
    const AUTOCOMPLETION_URL = 'https://autocomplete.geocoder.ls.hereapi.com/6.2/suggest.json';
    // const AUTOCOMPLETION_URL = 'https://discover.search.hereapi.com/v1/discover';
    this.searchAddressCtrl.valueChanges
      .pipe(
        debounceTime(500),
        tap(() => {
          this.errorMsg = "";
          this.filteredData = [];
          this.isLoading = true;
        }),
        switchMap(value => this.http.get(AUTOCOMPLETION_URL + "?query=" + value + "&apiKey=" + this.appCode)
        // switchMap(value => this.http.get(AUTOCOMPLETION_URL + "?at=42.36399,-71.05493" +"&q=" + value + "&in=countryCode:FRA"+ "&apiKey=" + this.appCode)
          .pipe(
            finalize(() => {
              this.isLoading = false
            }),
          )
        )
      )
      .subscribe(data=> {
        if (data['suggestions'] == undefined) {
          this.errorMsg = data['Error'];
          this.filteredData = [];
        } else {
          this.errorMsg = "";
          this.filteredData = data['suggestions'];
        }
      });
  }

  //occored when auto-complete option selected
  public selected(event : any){
    this.address = event.option.value.address;
  }

  //display user's label(country)
  public displayFn(item : any) : string{
    return item? item.label : item;
  }

  //map's event (zoom and pan)
  public ngAfterViewInit() {
    let defaultLayers = this.platform.createDefaultLayers();
    this.map = new H.Map(
        this.mapElement.nativeElement,
        defaultLayers.vector.normal.map,
        {
            zoom: 10,
            center: { lat: this.lat, lng: this.lng }
        }
    );
    let behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(this.map));
    let ui = H.ui.UI.createDefault(this.map,defaultLayers);
  }
}