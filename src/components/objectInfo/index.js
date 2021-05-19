const ObjectInfo = (props) => {
    return ( 
        <div className={`info-container ${props.className}`}>
            <div className="info">
                <p className={`my-small ${props.classNamep}`}>{props.label}</p>
                <div className="large">{props.info}</div> 
            </div>
            <button className="large">edit</button>
        </div>
     );
}
 
export default ObjectInfo;