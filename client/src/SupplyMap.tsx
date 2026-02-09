import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

interface Coordinates { lat: number; lng: number; }

interface Node {
  company_name: string;
  role: string;
  found: boolean;
  coordinates?: Coordinates;
}

export default function SupplyMap({ nodes }: { nodes: Node[] }) {
  const apiKey = import.meta.env.VITE_MAPS_API_KEY;

  // Center map on the first found node, or fallback to "Null Island" (0,0)
  const center = nodes.find(n => n.found && n.coordinates)?.coordinates || { lat: 20, lng: 0 };

  return (
    <div style={{ height: '500px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid #444', marginTop: '20px' }}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={2} // Zoom 2 shows the whole world (Global Supply Chain view)
          mapId="DEMO_MAP_ID" // Required for Advanced Markers
          options={{
             disableDefaultUI: true, // Clean look
             zoomControl: true,
             mapTypeId: 'hybrid' // Satellite view looks more "Enterprise"
          }}
        >
          {nodes.map((node, i) => (
            node.found && node.coordinates && (
              <AdvancedMarker key={i} position={node.coordinates}>
                {/* Custom Pin: Red for critical/manufacturing, Blue for others? Let's go Red for drama. */}
                <Pin background={'#ef4444'} borderColor={'#000'} glyphColor={'#fff'} />
                
                {/* Optional: Simple tooltip on hover */}
                <div style={{ 
                    position: 'absolute', top: '-30px', left: '-50%', 
                    background: 'rgba(0,0,0,0.8)', color: 'white', 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '10px', whiteSpace: 'nowrap'
                }}>
                  {node.company_name}
                </div>
              </AdvancedMarker>
            )
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}