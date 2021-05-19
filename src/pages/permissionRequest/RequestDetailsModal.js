import React, { useEffect, useState } from 'react'
import MyModal from "../../components/modal";
import ReqFrom from '../../components/permRequestUtils/reqFrom';
import ReqFor from '../../components/permRequestUtils/reqFor';

import Steps from '../../components/steps';

import Button2 from '../../components/b_button';
import { Container } from "react-bootstrap";
import CustomCard from "../../components/card";
import Page from '../../components/page';
import Header from "../../components/header";
import SideBar from "../../components/sideBar";
import { people } from '../../data/people'

const RequestDetailsModal = (props) => {
    var requestInfo = props.requestItemInfo;
    var { _rowNumber } = requestInfo;
    let RequestAndUserInfo = {
        doors: requestInfo.doors,
        email: requestInfo.email,
        first_name: requestInfo.first_name,
        last_name: requestInfo.last_name,
        message: requestInfo.message,
        name: requestInfo.name,
        type: requestInfo.type,
        user_type: requestInfo.user_type
    }
    return (<><div onClick={props.hideSRDM} className="my-backdrop" />
                <div className={` content-wrapper_ perm-request`} >
                    <div className="modal-g">
                        <h3>Permissions Request</h3>
                        <div className="desc">
                        <Steps className="active-step" nbr={props.stepNumber}/>                          
                            <ReqFrom RequestAndUserInfo={RequestAndUserInfo}/>    
                            <ReqFor RequestAndUserInfo={RequestAndUserInfo}/>
                            <div className="buttons">
                                <Button2 className="submit" onClick={ ()=> props.deleteRequestByRowNumber(_rowNumber, "Approve") }>
                                    Approve
                                </Button2>
                                <Button2 className="cancel" onClick={() => props.deleteRequestByRowNumber(_rowNumber, "Deny")}>
                                    Deny
                                </Button2>
                            </div>
                        </div>
                    </div>
                </div>
            </>);
}
 
export default RequestDetailsModal;