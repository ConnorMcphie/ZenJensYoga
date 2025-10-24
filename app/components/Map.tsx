"use client"; // required in Next.js app directory

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {memo} from 'react'


L.Icon.Default.mergeOptions({
    iconUrl: "/marker-icon.png",
    shadowUrl: "/marker-shadow.png",
});



 function Map() {
    const position: [number, number] = [55.82728522566147, -4.0665917578261155]; // Replace with your location

    return (
        <div className="h-96 w-full rounded-2xl overflow-hidden">
            <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position}>
                    <Popup>
                        Viewpark Community Centre<br />Old Edinburgh Rd, Uddingston, G71 6PG                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
}
export default memo(Map);