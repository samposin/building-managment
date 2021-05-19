import React, { useEffect, useState } from 'react'
import Map from '../../components/Map';
import AccessRequestModal from '../../pages/permissionRequest/AccessRequestModal';

const AccessReqeust = () => {
    const [prDisplay, setPrDisplay] = useState(false);
    const [buildingInfo, setBuildingInfo] = useState({
        name: "Wendt Common",
        doors: "Room 43",
        type: "Class Rooms"
    });

    const hideModal = () => {
        setPrDisplay(false);
    }
    const showModal = () => {
        setPrDisplay(true);
    }

    useEffect(() => {

    }, []);

    return (<>{ (prDisplay) ? <AccessRequestModal hideRequestModal={hideModal} buildingInfo={buildingInfo} /> : 
        <div className="row no-gutters" style={{ backgroundColor: 'grey', height:'100vh'}}>
            <div className="col-3">
                <div className="req-info-home" id="slide-in-request-penel">
                    <p>
                        <span className="light">Building</span> { buildingInfo.name }
                    </p>
                    <p>
                        <span className="light">Door(s)</span> { buildingInfo.doors }
                    </p>
                    <p>
                        <span className="light">Type</span> { buildingInfo.type }
                    </p>
                    <button type="button" className="mt-3 req-info-home-btn" onClick={ ()=> setPrDisplay(true)}>Request Access</button>
                </div>
            </div>
            <div className="col-6 d-flex flex-row justify-content-center align-items-center">
            <Map />
            </div>
            <div className="col-3"></div>
        </div>
}
    </>)
}
export default AccessReqeust;