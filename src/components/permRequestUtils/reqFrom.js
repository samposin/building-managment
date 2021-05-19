import MonicaImg from '../../assets/icons/svg/monica.png'
import ReqDesc from './reqDesc';
const ReqFrom = (props) => {
    let RequestAndUserInfo = props.RequestAndUserInfo;
    return ( 
        <div className="req-from">
            <h4 className="req-title">Request from</h4>
            <div className="req-infos">
                <div className="req-profil">
                    <img src={MonicaImg} alt="" />
                    <div>
                        <h4>{ RequestAndUserInfo.first_name }</h4>
                        <h4>{ RequestAndUserInfo.last_name }</h4>
                        <p className="b-text-b">{ RequestAndUserInfo.email }</p>
                    </div>
                </div>
                <div className="req-info">
                    <div>
                        <p className='x-small req-p'>User Type</p>
                        <label>{ RequestAndUserInfo.user_type }</label>
                    </div>
                    <div>
                        <p className='x-small req-p'>Key(s) Type</p>
                        <label>Wiscard</label>
                    </div>
                    <div>
                        <p className='x-small req-p'>Key(s)</p>
                        <label>279024</label>
                    </div>
                </div>
                </div>
            <div className="req-desc-note">
                <p className="x-small note">Note</p>
                <div className='req-desc'>
                    <p className="large">{ RequestAndUserInfo.message }</p>
                </div>
            </div>
        </div>
     );
}
 
export default ReqFrom;