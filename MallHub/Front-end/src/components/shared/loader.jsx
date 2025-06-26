import loader from '@/assets/loader.gif';

const Loader = ({
    width = 150,
    height = 150,
    clasName = '',
    style = {}
}) => {
    return (<div className={clasName} style={style}>
        <img src={loader} height={width} width={height} alt="Loading..." />
    </div>);
}

export default Loader;