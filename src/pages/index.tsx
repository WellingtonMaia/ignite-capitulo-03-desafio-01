import { useState } from 'react';
import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';
import { AiOutlineCalendar, AiOutlineUser } from 'react-icons/ai';
import Link from 'next/link';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { formatDate } from '../utils/formatDate';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string | null>(postsPagination.next_page);

  async function handlePostLoadMore() {
    const postsCloned = [...posts];

    const responsePost = await fetch(nextPage,{
      method: 'GET',
    }).then(response => response.json());

    const postsData = responsePost.results.map(post => formatDataPost(post));

    setPosts([...postsCloned, ...postsData]);
    setNextPage(responsePost.next_page)
  }

  return (
   <main className={styles.container}>
     <div className={styles.post}>
      {posts.map(post => (
        <Link key={post.uid} href={`/post/${post.uid}`}>
          <a>
            <strong>{post.data.title}</strong>
            <p>{post.data.subtitle}</p>
            <div className={commonStyles.postDetails}>
              <span><AiOutlineCalendar />
              { formatDate(post.first_publication_date) }
              </span>
              <span><AiOutlineUser /> {post.data.author}</span>
            </div>
          </a>
        </Link>
      ))}
     </div>
     {nextPage &&
     <div className={styles.loadMore}>
      <button onClick={handlePostLoadMore}>
          <strong>Carregar mais posts</strong>
      </button>
      </div>
     }
   </main>
 )
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize : 1, page : 1,
    }
  );

  const posts = postsResponse.results.map(post => formatDataPost(post));

  return {
    revalidate: 60 * 30, // 30 minutes
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page,
      }
    }
  }
};

const formatDataPost = (post: Post) : Post => {
  return {
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    }
  }
}
