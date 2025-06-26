import loader from '@/assets/loader.gif';

const LoadingPage = () => {
    return (<div 
        className="z-20 absolute top-0 left-0 bg-background"
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw' }}>
        <img src={loader} height={150} width={150} alt="Loading..." />
    </div>);
}

export default LoadingPage;