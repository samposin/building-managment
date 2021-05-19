import React, { useEffect, useState } from 'react'
import MyModal from "../../components/modal";
import ReqProfil from '../../components/permRequestUtils/profil';
import Button2 from '../../components/b_button';
import { Container } from "react-bootstrap";
import CustomCard from "../../components/card";
import Steps from '../../components/steps';
import Page from '../../components/page';
import Header from "../../components/header";
import SideBar from "../../components/sideBar";
import { people } from '../../data/people'

import { useToasts } from 'react-toast-notifications'
import { Redirect } from 'react-router';

import { GoogleSpreadsheet } from "google-spreadsheet";
import config from '../../config';

const SHEET_ID = "1723216762";
const SPREADSHEET_ID = config.spread_sheet_id;
const CLIENT_EMAIL = config.client_email;
const PRIVATE_KEY = config.private_key;
const doc = new GoogleSpreadsheet(SPREADSHEET_ID);


var user = localStorage.getItem('userInfo');
user = JSON.parse(user);

const PrmsRequest = (props) => {
    const { addToast } = useToasts();

    const [values, setValues] = useState({
        name: props.buildingInfo.name,
        doors: props.buildingInfo.doors,
        type: props.buildingInfo.type,
        message: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues({
            ...values, 
            [name]: value
        });
    }

    const appendSpreadsheet = async () => {

        const row = {
            ...values,
            first_name: user.first_name,
            last_name: user.last_name,
            user_type: user.user_type,
            email: user.email
            };
        try {
          await doc.useServiceAccountAuth({
            client_email: CLIENT_EMAIL,
            private_key: PRIVATE_KEY,
          });
          // loads document properties and worksheets
          await doc.loadInfo();
      
          const sheet = doc.sheetsById[SHEET_ID];
          const result = await sheet.addRow(row);
          addToast("Request Submitted", {
            appearance: 'success',
            autoDismiss: true,
          });
          setValues({
            name: '',
            doors: '',
            type: '',
            message: ''
          });
          props.hideRequestModal();
        } catch (e) {
          console.error('Error: ', e);
        }
    };

    useEffect(() => {
        // appendSpreadsheet(newRow);
    }, []);

    if(!user){
        return <Redirect to="login"/>
    }

    return (
        <Container style={{maxWidth: "100%", paddingRight: "0",paddingLeft: "0" }} >
            <SideBar>
                <Page>
                    <Header title="People" add="Add People"/>
                    <CustomCard objects={people} type="people" />
                    <div onClick={props.hideRequestModal} className="backdrop" />
                        <div className={` content-wrapper_ perm-request`} >
                            <div className="modal-g">
                            <h3>Permissions Request</h3>
                            <div className="desc">
                            <Steps className="active-step" nbr={1}/>                          
                                <div style={{marginTop:"40px"}}>
                                    <ReqProfil user={user}/>
                                </div>
                                <div >
                                    <div className='my-req-desc'>
                                        <textarea name="message" className="large" cols="66" onChange={handleChange} rows="4" placeholder="please type here..." value={values.message}></textarea>
                                    </div>
                                </div>
                                <div className="buttons">
                                    <Button2 className="submit" onClick={appendSpreadsheet}>
                                        Submit
                                    </Button2>
                                    <Button2 className="cancel" onClick={props.hideRequestModal}>
                                    Cancel
                                    </Button2>
                                </div>
                            </div>
                            </div>
                        </div>
                    {/* </div> */}
                </Page>
            </SideBar>
        </Container>
     );
}
 
export default PrmsRequest;