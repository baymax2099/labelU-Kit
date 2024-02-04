import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { ExportOutlined } from '@ant-design/icons';

import { ReactComponent as Logo } from '@/assets/logo.svg';
import { MENU } from '@/constant';

const extraLinks = [
  {
    name: 'LabelU',
    path: 'https://opendatalab.github.io/labelU/',
    icon: <ExportOutlined rev={undefined} />,
  },
  {
    name: 'OpenDataLab',
    path: 'https://opendatalab.com/',
    icon: <ExportOutlined rev={undefined} />,
  },
];

export default ({ children }: React.PropsWithChildren) => {
  const isIframe = window.self !== window.top;
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex justify-between px-4 leading-[48px] h-12 border-b-2">
        <div className="flex gap-6">
          {!isIframe && (
            <Link className="text-neutral-800 flex items-center text-2xl" to="/">
              <Logo className="" />
            </Link>
          )}
          <div className="flex gap-4">
            {MENU.map((menu) => {
              return (
                <Link
                  key={menu.path}
                  to={menu.path}
                  className={clsx('text-neutral-800 flex items-center gap-1', {
                    'text-primary': location.pathname === menu.path,
                  })}
                >
                  {menu.icon}
                  {menu.name}
                </Link>
              );
            })}
          </div>
        </div>
        {!isIframe && (
          <div className="flex gap-6">
            {extraLinks.map((link) => {
              return (
                <div key={link.name}>
                  <a
                    className="text-neutral-800 flex items-center gap-1"
                    href={link.path}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {link.name}
                    {link.icon}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex-1 bg-slate-100 flex flex-col">{children}</div>
    </div>
  );
};
