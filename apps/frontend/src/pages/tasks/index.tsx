import React, { useEffect } from 'react';
import { Alert, Button, Pagination } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import type { Dispatch, RootState } from '@/store';
import { useResponse } from '@/components/FlexItem';

import currentStyles from './index.module.scss';
import TaskCard from './components/taskCard';
import NullTask from './components/nullTask';

const TaskList = () => {
  const dispatch = useDispatch<Dispatch>();
  const navigate = useNavigate();

  const { isLargeScreen, isRegularScreen, isSmallScreen, isXLargeScreen, isXSmallScreen, isXXSmallScreen } =
    useResponse();

  let pageSize = 16;

  if (isXXSmallScreen) {
    pageSize = 10;
  } else if (isXSmallScreen) {
    pageSize = 12;
  } else if (isSmallScreen || isRegularScreen) {
    pageSize = 16;
  } else if (isLargeScreen) {
    pageSize = 20;
  } else if (isXLargeScreen) {
    pageSize = 36;
  }

  const [searchParams, setSearchParams] = useSearchParams({
    page: '1',
    size: String(pageSize),
  });

  // 初始化获取任务列表
  useEffect(() => {
    dispatch.task.fetchTasks({
      page: Number(searchParams.get('page')) - 1,
      size: searchParams.get('size') ? +searchParams.get('size')! : pageSize,
    });
  }, [dispatch.task, pageSize, searchParams]);

  const { meta_data, data: tasks = [] } = useSelector((state: RootState) => state.task.list);
  const loading = useSelector((state: RootState) => state.loading.effects.task.fetchTasks);

  const createTask = () => {
    dispatch.task.clearTaskItemAndConfig();
    navigate('/tasks/0/edit');
  };

  return (
    <React.Fragment>
      <div className={currentStyles.tasksWrapper}>
        <Alert
          className={currentStyles.alert}
          type="info"
          showIcon
          message={
            <div>
              当前为体验版，每日凌晨数据将自动清空，请及时备份重要数据。如需完整使用，建议
              <a href="https://github.com/opendatalab/labelU#getting-started" target="_blank" rel="noreferrer">
                本地部署
              </a>
            </div>
          }
        />
        {tasks.length > 0 && (
          <Button className={currentStyles.createTaskButton} type="primary" onClick={createTask}>
            新建任务
          </Button>
        )}
        <div className={currentStyles.cards}>
          {tasks.map((cardInfo: any, cardInfoIndex: number) => {
            return <TaskCard key={cardInfoIndex} cardInfo={cardInfo} />;
          })}
          {tasks.length === 0 && !loading && <NullTask />}
        </div>
        <div className={currentStyles.pagination}>
          <Pagination
            defaultCurrent={1}
            total={meta_data?.total ?? 0}
            pageSize={+searchParams.get('size')!}
            onChange={(value: number, _pageSize: number) => {
              searchParams.set('size', String(_pageSize));
              searchParams.set('page', String(value));
              setSearchParams(searchParams);
            }}
          />
        </div>
      </div>
    </React.Fragment>
  );
};

export default TaskList;
