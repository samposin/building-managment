import  React, {useState, useEffect, useRef } from "react";
import MyModal from "../../components/modal";
import Input from "../../components/input";
import MyButton from '../../components/s_button';
import InputRadio from '../../components/input_radio';
import mapboxgl from 'mapbox-gl';
// import DraggableMarker from '../../components/draggableMarker'

import { GoogleSpreadsheet } from "google-spreadsheet";
import config from "../../config";

const SPREADSHEET_ID = config.spread_sheet_id;
const CLIENT_EMAIL = config.client_email;
const PRIVATE_KEY = config.private_key;
const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

var Latitude, Longitude;
export default function AddDoor (props) {

    const [add, setAdd] = useState(false);
    const [values, setValues] = useState({});
    
    const getAdd = (isClick)=> {
        setAdd(isClick);
    }
    const passAdd = ()=> {
        props.getAdd(add);
    }
    const [selectedType, setSelectedType] = useState("Interior Private");
    const onValueChange= (event) => {
        setSelectedType(event.target.value)
    }

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
    
            var marker = new mapboxgl.Marker({
                draggable: true
            })
                .setLngLat([-89.40864500185694, 43.071436442382236])
                .addTo(map);
            function onDragEnd() {
                    var lngLat = marker.getLngLat();
                    coordinates.style.display = 'block';
                    coordinates.innerHTML =
                        'Longitude: ' + lngLat.lng + '<br />Latitude: ' + lngLat.lat;
                        Latitude = lngLat.lat; Longitude = lngLat.lng;

            }
            marker.on('dragend', onDragEnd);

        }, []);

        const onChange = (e) => {
            const { name, value } = e.target;
            setValues({
              ...values,
              [name]: value
            }); 
        }

        const addLockDevice = async () => {
            var SHEET_ID = "0";
            var doc1 = new GoogleSpreadsheet('1O_NSS9trFypqlxoPxj1C1B601i_Y23bAZ0PRZI6WaiU');											
            try {
              await doc1.useServiceAccountAuth({
                client_email: CLIENT_EMAIL,
                private_key: PRIVATE_KEY,
              });
              // loads document properties and worksheets
              await doc1.loadInfo();
        
              var row = {
                  ...values, Latitude, Longitude, "Device-ID": values.name, "Device-Name": values.building, "Status": "2-Alert",
              }
              const sheet = doc1.sheetsById[SHEET_ID];
              const result = await sheet.addRow(row);
              passAdd();
            } catch (e) {
              console.error("Error: ", e);
            }
          };
  
    return (
        <MyModal sendAdd = {getAdd} onClick={passAdd} >
            <div className="modal-g">
                <h3 className="h3">Add Door</h3>
                <div className="desc">
                    <form className="form" autocomplete="off" >
                        <div className="input-details">   
                            <div className="inputs">
                                <div className="group-input">
                                    <label>Name</label>
                                     <div className='input_ input-g'>
                                        <input type="text" value={values.name || "" } name="name" onChange={onChange} />
                                    </div>
                                </div>
                                <div className="building-d">
                                    <div className="group-input build">
                                        <label>Building</label>
                                        <div className='input_ input-g'>
                                        <input type="text" value={values.building || "" } name="building" onChange={onChange} />
                                        </div>
                                    </div>  
                                    <div className="group-input floor">
                                        <label>Floor</label>
                                        <div className='input_ input-g'>
                                        <input type="text" value={values.floor || "" } name="floor" onChange={onChange} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="type-p">
                                <label className="type">Type</label>
                                <InputRadio type="Building Entrance" selectedType={selectedType} change={onValueChange} className="in-radio"/>
                                <InputRadio type="Interior Public" selectedType={selectedType} change={onValueChange} className="in-radio" />
                                <InputRadio type="Interior Private" selectedType={selectedType} change={onValueChange} className="in-radio" />
                            </div> 
                        </div>
                        
                        <div className="map-it">
                            <label>Map It</label>
                            <div className="map p-1" style={{marginTop: -4 }}>
                                <div id="map" style={{width:"100%",height:"300px", borderRadius: '42px'}}></div>
                                {/* <img src={WendtFloor} alt="" id="map"/> */}
                                <pre ref ={myRef} id="coordinates" className="coordinates" ></pre>
                            </div>
                        </div>
                        <MyButton className1="g-container" className2="small-b" onClick={()=> {
                            addLockDevice();
                        } }>Save</MyButton>
                    </form>
                </div>
            </div>
        </MyModal>
    );
}