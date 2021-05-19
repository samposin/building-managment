import MonicaImg from '../../assets/icons/svg/monica.png'
const ReqProfil = (props) => {
    var user = props.user;
    return ( 
        <div className="req-profil">
            <img src={MonicaImg} alt="" />
            { (user) ? <div>
                <h4>{ user.first_name }</h4>
                <h4>{ user.last_name }</h4>
                <p className="b-text-b">{user.email}</p>
            </div> : <div>
                <h4>Monica</h4>
                <h4>Hall</h4>
                <p className="b-text-b">mhall2@wisc.edu</p>
            </div> }
        </div>
     );
}
 
export default ReqProfil;