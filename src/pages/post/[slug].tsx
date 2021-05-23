import { useRouter } from 'next/router'
import { GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { AiOutlineCalendar, AiOutlineUser } from 'react-icons/ai';
import { BiTimeFive } from 'react-icons/bi';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import { formatDate } from '../../utils/formatDate';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  const amountWordsReadPerMinutes = 200;
  const countTotalWords = post.data?.content.reduce((acc, curr) => {
    const countHeading = curr.heading.split(/ /).length;
    const countBodyWords = RichText.asText(curr.body).split(/ /).length;
    return acc += countHeading + countBodyWords;
  }, 1);

  const totalMinutesToRead = Math.floor(
    countTotalWords/amountWordsReadPerMinutes
    ) + 1;

  const newContent =  post.data.content.map(post => {
    return {
      ...post,
      body: {
        text: RichText.asHtml(post.body)
      }
    }
  });

  if (router.isFallback) {
    return (<div>Carregando...</div>);
  }

  return (
    <main className={styles.container}>
      <article>
        <div className={styles.banner}>
          <img src={post.data.banner.url} alt={post.data.title} />
        </div>
        <div className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={commonStyles.postDetails}>
            <span><AiOutlineCalendar /> {
              formatDate(post.first_publication_date)
            }</span>
            <span><AiOutlineUser /> {post.data.author}</span>
            <span><BiTimeFive /> {`${totalMinutesToRead} min`}</span>
          </div>
          <div className={styles.content}>
            {newContent.map(content => (
              <div key={content.heading}>
                <h2>{content.heading}</h2>
                <div dangerouslySetInnerHTML={{
                  __html: content.body['text']
                }} />
              </div>
            ))}
          </div>
        </div>
      </article>
    </main>
  )
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {}).then(data => data.results);

  const params = posts.map(post => {
    return {
      params: { slug: post.uid }
    }
  });

  return {
    paths: params,
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID(
    'posts', String(params.slug), {}
    );

  const postData = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: content.body,
        }
      }),
    }
  }

  return {
    props: {
      post: postData
    },
    revalidate: 60 * 60 * 24 // 24 hours
  }
}
