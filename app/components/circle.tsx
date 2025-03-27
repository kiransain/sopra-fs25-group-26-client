/**
 * Copyright 2024 Google LLC
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *    https://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

// "use client";

// import {
//   forwardRef,
//   useContext,
//   useEffect,
//   useImperativeHandle,
//   useRef
// } from 'react';
// import { GoogleMapsContext, latLngEquals } from '@vis.gl/react-google-maps';

// type CircleEventProps = {
//   onClick?: (e: google.maps.MapMouseEvent) => void;
//   onDrag?: (e: google.maps.MapMouseEvent) => void;
//   onDragStart?: (e: google.maps.MapMouseEvent) => void;
//   onDragEnd?: (e: google.maps.MapMouseEvent) => void;
//   onMouseOver?: (e: google.maps.MapMouseEvent) => void;
//   onMouseOut?: (e: google.maps.MapMouseEvent) => void;
//   onRadiusChanged?: (r: number) => void;
//   onCenterChanged?: (p: google.maps.LatLng | null) => void;
// };

// export type CircleProps = google.maps.CircleOptions & CircleEventProps;

// function useCircle(props: CircleProps) {
//   const {
//     onClick,
//     onDrag,
//     onDragStart,
//     onDragEnd,
//     onMouseOver,
//     onMouseOut,
//     onRadiusChanged,
//     onCenterChanged,
//     radius,
//     center,
//     ...circleOptions
//   } = props;

//   const circle = useRef(new google.maps.Circle()).current;
//   circle.setOptions(circleOptions);

//   useEffect(() => {
//     if (!center) return;
//     if (!latLngEquals(center, circle.getCenter())) circle.setCenter(center);
//   }, [center, circle]);

//   useEffect(() => {
//     if (radius === undefined || radius === null) return;
//     if (radius !== circle.getRadius()) circle.setRadius(radius);
//   }, [radius, circle]);

//   const map = useContext(GoogleMapsContext)?.map;

//   useEffect(() => {
//     if (!map) {
//       if (map === undefined) {
//         console.error('<Circle> has to be inside a Map component.');
//       }
//       return;
//     }

//     circle.setMap(map);

//     return () => {
//       circle.setMap(null);
//     };
//   }, [map, circle]);

//   useEffect(() => {
//     if (!circle) return;
  
//     const gme = google.maps.event;
//     const listeners = [
//       ['click', onClick],
//       ['drag', onDrag],
//       ['dragstart', onDragStart],
//       ['dragend', onDragEnd],
//       ['mouseover', onMouseOver],
//       ['mouseout', onMouseOut]
//     ].map(([eventName, handler]) => {
//       if (typeof handler === 'function') {
//         return gme.addListener(circle, eventName as keyof google.maps.CircleOptions, handler);
//       }
//       return null;
//     }).filter((listener): listener is google.maps.MapsEventListener => listener !== null);
  
//     const radiusListener = onRadiusChanged
//       ? gme.addListener(circle, 'radius_changed', () => onRadiusChanged(circle.getRadius()))
//       : null;
  
//     const centerListener = onCenterChanged
//       ? gme.addListener(circle, 'center_changed', () => onCenterChanged(circle.getCenter()))
//       : null;
  
//     return () => {
//       listeners.forEach(listener => gme.removeListener(listener));
//       if (radiusListener) gme.removeListener(radiusListener);
//       if (centerListener) gme.removeListener(centerListener);
//     };
//   }, [circle, onClick, onDrag, onDragStart, onDragEnd, onMouseOver, onMouseOut, onRadiusChanged, onCenterChanged]);
  
//   return circle;
// }


