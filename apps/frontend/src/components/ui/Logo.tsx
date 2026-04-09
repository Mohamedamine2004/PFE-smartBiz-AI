import logod from '../../assets/logod.svg';
import logol from '../../assets/logol.svg';

interface LogoProps {
  className?: string;
}

export const Logo = ({ className = 'h-20 w-auto' }: LogoProps) => (
  <>
    <img src={logol} alt="SmartBiz AI" className={`${className} dark:hidden`} />
    <img src={logod} alt="SmartBiz AI" className={`${className} hidden dark:block`} />
  </>
);
