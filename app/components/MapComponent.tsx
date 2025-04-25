// actual google maps rendering, displays map size, markers, circles, etc.
import { GoogleMap } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
};

const center = {
  lat: 37.7749,
  lng: -122.4194,
};

export default function MapComponent() {
  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
      {/* here markers etc. can be inserted.*/}
    </GoogleMap>
  );
}
