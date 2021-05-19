import mapboxgl from 'mapbox-gl';
import React, {useEffect} from 'react';

const Map = () => {
    var myRef = React.createRef();
   
    useEffect(() => {
        var coordinates = myRef.current;
        mapboxgl.accessToken = 'pk.eyJ1IjoiYWxleG1haG5rZSIsImEiOiJja25oc3psc2cwbWd2MnZudzA1d2dpOW5wIn0.w7LO2v86HxcaZUPdkmFk7g';
        var map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/alexmahnke/cknht620v00d317ocx08bve1u',
            center: [-89.40864500185694, 43.071436442382236],
            zoom: 18
        });

        map.on('click', function (e) {
           var slideInRequestPanel = document.getElementById('slide-in-request-penel').classList;;
           if( ! slideInRequestPanel.contains("show") ){
            slideInRequestPanel.add('show');
           }
        });

        }, []);
        
    return (
        <>
            <div id="map" style={{width:"249px",height:"363px"}}></div>
            {/* <img src={WendtFloor} alt="" id="map"/> */}
            <pre ref ={myRef} id="coordinates" className="coordinates" ></pre>
        </>
     );
}
 
export default Map;