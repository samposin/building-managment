import FloorLayout from '../../assets/icons/svg/reqMap.svg'
const ReqFor = (props) => {
    let RequestAndUserInfo = props.RequestAndUserInfo;
    return ( 
        <div className="req-from">
            <h4 className="req-title">For</h4>
            <div className="req-infos-for">

                <div className="req-info">
                    <div>
                        <p className='x-small req-p'>Building</p>
                        <label>{RequestAndUserInfo.name}</label>
                    </div>
                    <div>
                        <p className='x-small req-p'>Door(s)</p>
                        <label>{ RequestAndUserInfo.doors}</label>
                    </div>
                    <div>
                        <p className='x-small req-p'>Type</p>
                        <label>
                            {RequestAndUserInfo.type}
                        </label>
                    </div>
                </div>
                <div className="floor-layout">
                    <img src={FloorLayout} alt="" />
                    <p className="b-text-b">Open Floor Layout ⇗</p>
                </div>
            </div>
        </div>
     );
}
 
export default ReqFor;