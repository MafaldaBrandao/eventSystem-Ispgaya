import { useEffect, useRef, useState } from 'react';

import { adminInput, blockText } from '../../styles/ui';
import { hasGoogleMapsApiKey, loadGoogleMapsPlacesApi } from '../../utils/googleMaps';
import { getLocaleText, useLocale } from '../../i18n/locale';

type PlaceAddressComponent = {
  long_name: string;
  types: string[];
};

type PlaceResultLike = {
  address_components?: PlaceAddressComponent[];
  formatted_address?: string;
  name?: string;
};

type AutocompleteLike = {
  addListener: (eventName: string, handler: () => void) => void;
  getPlace: () => PlaceResultLike;
};

type GoogleMapsLocationFieldProps = {
  inputId: string;
  label?: string;
  onCityChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  suggestions?: string[];
  value: string;
  citySuggestions?: string[];
};

function extractCityFromPlace(place: PlaceResultLike): string {
  const components = place.address_components || [];
  const cityComponent = components.find((component) =>
    component.types.some((type) =>
      ['locality', 'postal_town', 'administrative_area_level_2', 'sublocality'].includes(type)
    )
  );

  return cityComponent?.long_name || '';
}

function GoogleMapsLocationField({
  inputId,
  label,
  onCityChange,
  onLocationChange,
  suggestions = [],
  value,
  citySuggestions = [],
}: GoogleMapsLocationFieldProps) {
  const { locale } = useLocale();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<AutocompleteLike | null>(null);
  const [mapsStatus, setMapsStatus] = useState<'idle' | 'ready' | 'error'>('idle');
  const datalistId = `${inputId}-suggestions`;
  const [filteredCities, setFilteredCities] = useState<string[]>(citySuggestions);
  const [selectedCity, setSelectedCity] = useState<string>('');

  useEffect(() => {
    if (!hasGoogleMapsApiKey()) {
      setMapsStatus('error');
      return;
    }

    let active = true;

    void loadGoogleMapsPlacesApi()
      .then(() => {
        if (!active || !inputRef.current || autocompleteRef.current || !window.google?.maps?.places) {
          return;
        }

        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ['address_components', 'formatted_address', 'name'],
          types: ['establishment', 'geocode'],
        }) as AutocompleteLike;

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (!place) {
            return;
          }

          const nextLocation = place.formatted_address?.trim() || place.name?.trim() || value;
          if (nextLocation) {
            onLocationChange(nextLocation);
          }

          const nextCity = extractCityFromPlace(place);
          if (nextCity) {
            onCityChange(nextCity);
          }
        });

        setMapsStatus('ready');
      })
      .catch(() => {
        if (active) {
          setMapsStatus('error');
        }
      });

    return () => {
      active = false;
    };
  }, [onCityChange, onLocationChange, value]);

  // Update filtered cities when citySuggestions change
  useEffect(() => {
    setFilteredCities(citySuggestions);
  }, [citySuggestions]);

  return (
    <div className="space-y-3">
      {citySuggestions.length > 0 && (
        <div>
          <input
            id={`${inputId}-city`}
            className={adminInput}
            list={`${inputId}-city-suggestions`}
            value={selectedCity}
            onChange={(event) => {
              const nextCity = event.target.value;
              setSelectedCity(nextCity);
              onCityChange(nextCity);
              // Filter cities as user types
              if (nextCity) {
                const filtered = citySuggestions.filter((c) =>
                  c.toLowerCase().includes(nextCity.toLowerCase())
                );
                setFilteredCities(filtered);
              } else {
                setFilteredCities(citySuggestions);
              }
            }}
            placeholder={getLocaleText(locale, 'Pesquisar cidade...', 'Search city...')}
          />
          <datalist id={`${inputId}-city-suggestions`}>
            {filteredCities.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        </div>
      )}
      <input
        ref={inputRef}
        id={inputId}
        className={adminInput}
        list={suggestions.length > 0 ? datalistId : undefined}
        value={value}
        onChange={(event) => onLocationChange(event.target.value)}
        placeholder={label || getLocaleText(locale, 'Pesquisar local no Google Maps', 'Search location on Google Maps')}
      />
      {suggestions.length > 0 ? (
        <datalist id={datalistId}>
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      ) : null}
      {mapsStatus === 'ready' ? (
        <p className={blockText}>{getLocaleText(locale, 'Autocomplete Google Maps ativo e dropdown com locais já usados.', 'Google Maps autocomplete is active with a dropdown of previously used locations.')}</p>
      ) : null}

    </div>
  );
}

export default GoogleMapsLocationField;
